import { openai } from "@ai-sdk/openai";
import { countTokens, trackTokenCount } from "@server/redis/token-tracker";
import { generateText as generateTextAi } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { ERROR_CODES, handleApiError } from "@server/middlewares/auth-token-limit";
import { getUserSubscription } from "@server/server-functions/get-subscription";
import { getUserTokenLimit, checkTokenLimit } from "@server/redis/token-tracker";
import { after } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // 认证和token限制检查
        const { session, subscription } = await getUserSubscription();
        
        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: '未授权',
                errorCode: ERROR_CODES.UNAUTHORIZED
            }, { status: 401 });
        }

        const user = session.user;
        
        // 获取用户token限额并检查
        const limit = await getUserTokenLimit(user.id);
        const isWithinLimit = await checkTokenLimit(user.id, limit);
        
        if (!isWithinLimit) {
            return NextResponse.json({
                success: false,
                error: '您已达到本月token使用限制，请联系管理员或等待下月重置',
                errorCode: ERROR_CODES.TOKEN_LIMIT_EXCEEDED
            }, { status: 403 });
        }

        // 获取请求参数
        const body = await req.json();
        const { prompt, model = 'gpt-4o-mini' } = body;

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '缺少必要参数 prompt',
                errorCode: ERROR_CODES.MISSING_PARAMETERS
            }, { status: 400 });
        }

        // 使用 ai-sdk 生成文本
        const result = await generateTextAi({
            model: openai(model),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        });

        // 从AI SDK返回的响应中获取使用情况
        const responseBody = result.response?.body as Record<string, unknown>;
        const usage = responseBody?.usage as Record<string, number>;
        const inputTokens = usage?.prompt_tokens || countTokens(prompt, model);
        const outputTokens = usage?.completion_tokens || countTokens(result.text, model);
        console.log(`API返回token使用: 输入=${inputTokens}, 输出=${outputTokens}, 总计=${usage?.total_tokens || 0}`);

        // 使用 Next.js after API 在响应完成后异步记录 token 使用情况
        after(async () => {
            await trackTokenCount({
                userId: user.id,
                inputTokens,
                outputTokens,
                model
            });
        });

        return NextResponse.json({
            success: true,
            data: result.text
        });
    } catch (err: unknown) {
        const { statusCode, errorCode, errorMessage, stack } = handleApiError(err);
        
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                errorCode: errorCode,
                stack
            },
            { status: statusCode }
        );
    }
} 