import { openai } from "@ai-sdk/openai";
import { countTokens, trackTokenCount } from "@server/redis/token-tracker";
import { streamText } from "ai";
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

        // 使用 Vercel AI SDK 创建流式响应
        const result = streamText({
            model: openai(model),
            messages: [{ role: 'user', content: prompt }],
        });

        // 使用一个变量收集完整响应
        let fullResponse = '';

        // 创建流式响应
        const stream = new ReadableStream({
            async start(controller) {
                for await (const delta of result.textStream) {
                    fullResponse += delta; // 收集响应
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));

                const inputTokens = countTokens(prompt, model);
                const outputTokens = countTokens(fullResponse, model);
                console.log(`估算token使用: 输入=${inputTokens}, 输出=${outputTokens}`);
                
                // 使用 Next.js after API 在响应完成后异步记录 token 使用情况
                after(async () => {
                    await trackTokenCount({
                        userId: user.id,
                        inputTokens,
                        outputTokens,
                        model
                    });
                });

                controller.close();
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
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