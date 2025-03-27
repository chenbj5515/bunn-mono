import { openai } from "@ai-sdk/openai";
import { countTokens, trackTokenCount } from "@server/redis/token-tracker";
import { generateText as generateTextAi } from "ai";
import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ERROR_CODES, handleApiError } from "@server/middlewares/auth-token-limit";

export const generateText = async (c: Context) => {
    try {
        // 获取中间件设置的用户信息
        const user = c.get('user');
        
        // 获取请求参数
        const body = await c.req.json();
        const { prompt, model = 'gpt-4o-mini' } = body;

        if (!prompt) {
            return c.json({
                success: false,
                error: '缺少必要参数 prompt',
                errorCode: ERROR_CODES.MISSING_PARAMETERS
            }, 400);
        }

        // 使用 ai-sdk 的 openaiClient 替代直接 fetch
        const result = await generateTextAi({
            model: openai(model),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        });

        // 从AI SDK返回的响应中获取使用情况
        // 检查response对象并安全地访问属性
        const responseBody = result.response?.body as Record<string, unknown>;
        const usage = responseBody?.usage as Record<string, number>;
        const inputTokens = usage?.prompt_tokens || countTokens(prompt, model);
        const outputTokens = usage?.completion_tokens || countTokens(result.text, model);
        console.log(`API返回token使用: 输入=${inputTokens}, 输出=${outputTokens}, 总计=${usage?.total_tokens || 0}`);

        // 使用 queueMicrotask 在响应完成后异步记录 token 使用情况
        queueMicrotask(async () => {
            await trackTokenCount({
                userId: user.id,
                inputTokens,
                outputTokens,
                model
            });
        });

        return c.json({
            success: true,
            data: result.text
        });
    } catch (err: unknown) {
        const { statusCode, errorCode, errorMessage, stack } = handleApiError(err);
        
        return c.json(
            {
                success: false,
                error: errorMessage,
                errorCode: errorCode,
                stack
            },
            statusCode as ContentfulStatusCode
        );
    }
}