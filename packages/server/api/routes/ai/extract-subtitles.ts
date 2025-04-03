import { ContentfulStatusCode } from 'hono/utils/http-status'
import { db } from '@server/db';
import { userActionLogs } from '@server/db/schema';
import { Context } from 'hono';
import { trackTokenCount } from '@server/redis/token-tracker';
import { ERROR_CODES, handleApiError } from '@server/middlewares/auth-token-limit';

export const extractSubtitles = async (c: Context) => {
    try {
        // 获取中间件设置的用户信息
        const user = c.get('user');
        
        // 处理 FormData 格式的请求
        const formData = await c.req.formData();
        const imageFile = formData.get('image') as File;

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

        const promptText = "请只识别并输出图片底部的日文字幕文本，不要输出其他内容。如果没有字幕，请返回''。";

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
                    max_tokens: 5000
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
            recordOperation().catch(err => console.error('后台操作错误:', err));

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
        const { statusCode, errorCode, errorMessage, stack } = handleApiError(err);
        
        return c.json({
            success: false,
            error: errorMessage,
            errorCode: errorCode,
            stack
        }, statusCode as ContentfulStatusCode);
    }
}