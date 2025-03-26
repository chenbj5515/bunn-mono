import { Hono } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { db } from '@/db';
import { userActionLogs } from '@/db/schema';
// import { getSession } from '@/lib/auth';
import { trackTokenCount, checkTokenLimit, getUserTokenLimit } from '@/redis/token-tracker';
// import { AI_MODELS, DEFAULT_MODEL_ID, isModelSupported, modelSupportsVision, ModelConfig } from '@/lib/ai/models';
import { getUserSubscription } from '@/server-functions/get-subscription';
// import { generateText } from "ai"
// import { openai } from "@ai-sdk/openai"

// 错误码定义
const ERROR_CODES = {
    // 认证相关错误 (1000-1999)
    UNAUTHORIZED: 1001,

    // 输入相关错误 (2000-2999)
    INVALID_REQUEST_BODY: 2001,
    MISSING_PARAMETERS: 2002,
    MISSING_IMAGE: 2003,

    // 限制相关错误 (3000-3999)
    TOKEN_LIMIT_EXCEEDED: 3001,

    // API相关错误 (4000-4999)
    API_KEY_MISSING: 4001,
    API_ERROR: 4002,
    MODEL_NOT_SUPPORTED: 4003,

    // 服务器错误 (5000-5999)
    INTERNAL_SERVER_ERROR: 5001
};

const app = new Hono()
    .post('/', async (c) => {
        try {
            // 获取用户会话
            const { session, subscription: { active, expireAt } } = await getUserSubscription();
            if (!session?.user) {
                return c.json({
                    success: false,
                    error: '未授权',
                    errorCode: ERROR_CODES.UNAUTHORIZED
                }, 401 as ContentfulStatusCode);
            }

            const user = session.user;

            // 获取用户token限额
            const limit = await getUserTokenLimit(user.id);

            // 检查是否超过限额
            const isWithinLimit = await checkTokenLimit(user.id, limit);
            if (!isWithinLimit) {
                return c.json({
                    success: false,
                    error: '您已达到本月token使用限制，请联系管理员或等待下月重置',
                    errorCode: ERROR_CODES.TOKEN_LIMIT_EXCEEDED
                }, 403 as ContentfulStatusCode);
            }

            // 处理 FormData 格式的请求
            const formData = await c.req.formData();
            const imageFile = formData.get('image') as File;

            // 使用固定的4o-mini模型
            // const modelId = '4o-mini';
            // const modelConfig = AI_MODELS[modelId] as ModelConfig;

            if (!imageFile) {
                return c.json({
                    success: false,
                    error: '未找到图片文件',
                    errorCode: ERROR_CODES.MISSING_IMAGE
                }, 400 as ContentfulStatusCode);
            }

            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');

            const promptText = "请只识别并输出图片底部的日文字幕文本，不要输出其他内容。如果没有字幕，请返回空字符串。";

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Image}`
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 100
                    })
                });

                // 解析API响应JSON
                const responseData = await response.json();
                
                // 从响应中提取字幕文本
                const subtitles = responseData.choices[0]?.message?.content || '';

                // 获取token使用情况
                const promptTokens = responseData.usage?.prompt_tokens || 1000;
                const completionTokens = responseData.usage?.completion_tokens || 0;

                console.log(`实际使用tokens(4o-mini): 输入=${promptTokens}, 输出=${completionTokens}`);

                // 异步处理记录操作，不阻塞响应
                // 检查是否支持executionCtx（Cloudflare Workers环境）
                const recordOperation = async () => {
                    try {
                        await Promise.all([
                            trackTokenCount({
                                userId: user.id,
                                inputTokens: promptTokens,
                                outputTokens: completionTokens,
                                model: "gpt-4o-mini"
                            }),
                            db.insert(userActionLogs).values({
                                userId: user.id,
                                actionType: 'COMPLETE_IMAGE_OCR',
                                relatedId: null,
                                relatedType: null
                            })
                        ]);
                    } catch (error) {
                        console.error('记录操作失败:', error);
                    }
                };

                // 根据环境选择合适的执行方式
                if (c.executionCtx) {
                    c.executionCtx.waitUntil(recordOperation());
                } else {
                    // 在不支持executionCtx的环境中，直接执行但不等待结果
                    recordOperation().catch(err => console.error('后台操作错误:', err));
                }

                return c.json({
                    success: true,
                    subtitles
                });
            } catch (err) {
                console.error('调用4o-mini模型失败:', err);
                return c.json({
                    success: false,
                    error: err instanceof Error ? err.message : '调用AI模型失败',
                    errorCode: ERROR_CODES.API_ERROR
                }, 500 as ContentfulStatusCode);
            }
        } catch (err: unknown) {
            console.error('OCR处理错误:', err instanceof Error ? err.message : '未知错误');

            // 根据错误类型返回不同的错误码和状态码
            let statusCode = 500;
            let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
            let errorMessage = '服务器内部错误';

            if (err instanceof Error) {
                errorMessage = err.message;

                // 识别特定类型的错误
                if (errorMessage.includes('API key')) {
                    errorCode = ERROR_CODES.API_ERROR;
                    errorMessage = 'API密钥错误';
                } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                    errorCode = ERROR_CODES.API_ERROR;
                    statusCode = 429;
                    errorMessage = 'API请求超过速率限制';
                } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
                    errorCode = ERROR_CODES.UNAUTHORIZED;
                    statusCode = 401;
                }
            }

            return c.json({
                success: false,
                error: errorMessage,
                errorCode: errorCode,
                stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
            }, statusCode as ContentfulStatusCode);
        }
    });

export default app