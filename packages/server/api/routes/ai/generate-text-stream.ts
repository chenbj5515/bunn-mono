import { openai } from "@ai-sdk/openai";
import { countTokens, trackTokenCount } from "@server/redis/token-tracker";
import { streamText } from "ai";
import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ERROR_CODES, handleApiError } from "@server/middlewares/auth-token-limit";

export const generateTextStream = async (c: Context) => {
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
            }, 400 as ContentfulStatusCode);
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
                
                // 使用 queueMicrotask 在响应完成后异步记录 token 使用情况
                queueMicrotask(async () => {
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

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
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