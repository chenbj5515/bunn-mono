import { NextRequest, NextResponse } from 'next/server';
import { db } from '@server/db';
import { userActionLogs } from '@server/db/schema';
import { trackTokenCount } from '@server/redis/token-tracker';
import { ERROR_CODES, handleApiError } from '@server/middlewares/auth-token-limit';
import { getUserSubscription } from '@server/server-functions/get-subscription';
import { getUserTokenLimit, checkTokenLimit } from '@server/redis/token-tracker';
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

        // 处理 FormData 格式的请求
        const formData = await req.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json({
                success: false,
                error: '未找到图片文件',
                errorCode: ERROR_CODES.MISSING_IMAGE
            }, { status: 400 });
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
            after(async () => {
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
            });

            return NextResponse.json({
                success: true,
                subtitles
            });
        } catch (err) {
            console.error('调用4o-mini模型失败:', err);
            return NextResponse.json({
                success: false,
                error: err instanceof Error ? err.message : '调用AI模型失败',
                errorCode: ERROR_CODES.API_ERROR
            }, { status: 500 });
        }
    } catch (err: unknown) {
        const { statusCode, errorCode, errorMessage, stack } = handleApiError(err);
        
        return NextResponse.json({
            success: false,
            error: errorMessage,
            errorCode: errorCode,
            stack
        }, { status: statusCode });
    }
} 