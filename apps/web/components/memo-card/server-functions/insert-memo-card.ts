"use server"
import { getSession } from "@server/lib/auth";
import { db } from "@db/index";
import { memoCard, userActionLogs, series, seriesMetadata } from "@db/schema";
import { sql, eq, and } from "drizzle-orm";
import { ContextContent } from '@/components/input-box';
import { headers } from "next/headers";

// 从Netflix URL中提取watchID
function extractNetflixWatchID(url: string): string | null {
    const regex = /netflix\.com\/watch\/(\d+)/;
    const match = regex.exec(url);
    return match ? match[1] as string : null;
}

// 从Ruby元素HTML中提取文本和对应的读音
interface RubyItem {
    text: string;
    reading: string;
}

function extractRubyItemsServer(pronunciationData: string): RubyItem[] {
    // 尝试解析JSON字符串
    try {
        const data = JSON.parse(pronunciationData.replace(/^```json|```$/g, ''));
        const items: RubyItem[] = [];
        
        // 如果有children属性并且是数组
        if (data.children && Array.isArray(data.children)) {
            // 遍历children数组
            for (const child of data.children) {
                // 检查是否是ruby标签
                if (typeof child === 'object' && child !== null && child.tag === 'ruby' && child.text && child.rt) {
                    items.push({
                        text: child.text,
                        reading: child.rt
                    });
                }
            }
        }
        
        return items;
    } catch (error) {
        console.error('解析pronunciation JSON数据失败:', error);
        return [];
    }
}

// 获取Ruby元素的翻译
async function translateRubyItemsServer(
    originalText: string,
    rubyItems: RubyItem[],
    cookieHeader: string
): Promise<Record<string, string>> {
    // 如果没有Ruby元素，返回空对象
    if (rubyItems.length === 0) {
        return {};
    }
    
    // 构建请求文本
    const requestText = `
        在下面句子的上下文中，请翻译以下单词到中文：

        句子: ${originalText}

        单词列表:
        ${rubyItems.map(item => `- ${item.text}（读音：${item.reading}）`).join('\n')}

        请以JSON格式返回每个单词的中文翻译，格式如下：
        {
        "单词1": "翻译1",
        "单词2": "翻译2"
        }
    `;

    try {
        // 发送请求到API端点
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            },
            body: JSON.stringify({
                prompt: requestText,
                model: 'gpt-4o',
            }),
        });

        if (!response.ok) {
            throw new Error('翻译请求失败');
        }

        const data = await response.json();
        let result: Record<string, string> = {};

        try {
            // 尝试解析返回的JSON
            if (data.success && typeof data.data === 'string') {
                // 提取JSON部分
                const jsonMatch = data.data.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (error) {
            console.error('解析翻译结果失败', error);
        }

        return result;
    } catch (error) {
        console.error('翻译请求出错', error);
        return {};
    }
}

export async function insertMemoCard(
    originalText: string,
    translation: string,
    pronunciation: string,
    url: string,
    contextContent: ContextContent | null
) {
    const session = await getSession();
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie') || '';

    if (!session?.user.id) {
        return null;
    }

    // 处理Ruby元素翻译
    let rubyTranslations = null;
    if (pronunciation) {
        try {
            const rubyItems = extractRubyItemsServer(pronunciation);
            console.log(rubyItems, "rubyItems=====")
            if (rubyItems.length > 0) {
                const translations = await translateRubyItemsServer(originalText, rubyItems, cookieHeader);
                if (Object.keys(translations).length > 0) {
                    rubyTranslations = JSON.stringify(translations);
                }
            }
        } catch (error) {
            console.error('处理Ruby元素翻译时出错', error);
        }
    }

    // 默认值
    let platform: string | null = null;
    let seriesId: string | null = null;
    const seriesTitle = contextContent?.seriesTitle || "";
    const watchId = extractNetflixWatchID(url);

    // 处理Netflix URL
    if (url && url.includes('netflix.com/watch')) {
        if (watchId) {
            platform = "netflix";

            const existingSeries = await db.select()
                .from(series)
                .where(
                    and(
                        eq(series.title, seriesTitle),
                    )
                )
                .limit(1);

            // 如果不存在，则创建新记录
            if (existingSeries.length === 0) {

                const seriesList = [
                    'Attack on Titan.png',
                    'Cyberpunk: Edgerunners.png',
                    'Dragon Ball.png',
                    'Neon Genesis Evangelion.png',
                    'Hunter x Hunter.png',
                    'Jujutsu Kaisen.png',
                    'Detective Conan.png',
                    'One Punch Man.png',
                    'The Seven Deadly Sins.png',
                    'Summer Time Rendering.png',
                    'Weathering with You.png',
                    'Anohana: The Flower We Saw That Day.png',
                    'Your Name.png'
                ];

                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookieHeader
                    },
                    body: JSON.stringify({
                        prompt: `如果${seriesList}」这个列表里有一个元素是${seriesTitle}这个剧集的英文译名，返回这个元素的索引。如果任何元素都不是对应的英文译名，那么返回-1。不要返回任何索引以外的内容。`
                    })
                });

                const result = await response.json();
                const seriesCoverIndex = result.success ? result.data : "";

                const [newSeries] = await db.insert(series).values({
                    platform: "netflix",
                    coverUrl: seriesList[seriesCoverIndex] ?? "",
                    title: seriesTitle
                }).returning();

                if (newSeries) {
                    seriesId = newSeries.id;
                }
            } else if (existingSeries[0]) {
                // 使用已存在的series记录
                seriesId = existingSeries[0].id;
            }
        }
    }

    const [newMemoCard] = await db.insert(memoCard).values({
        recordFilePath: "",
        originalText: originalText,
        reviewTimes: 0,
        translation: translation,
        userId: session.user.id,
        kanaPronunciation: pronunciation,
        createTime: sql`CURRENT_TIMESTAMP`,
        updateTime: sql`CURRENT_TIMESTAMP`,
        contextUrl: url,
        platform,
        seriesId,
        rubyTranslations,
    }).returning();

    // 异步处理后续操作，不等待完成
    if (newMemoCard) {
        // 使用void操作符忽略Promise结果，使后续操作异步执行
        void (async () => {
            try {
                // 确保newMemoCard存在，并且有contentId（表示这是一个剧集相关的记忆卡片）
                if (seriesId && contextContent) {
                    // 检查是否需要添加series_metadata记录
                    if (contextContent.seriesNum && contextContent.episodeNumber) {
                        const season = parseInt(contextContent.seriesNum);
                        const episode = parseInt(contextContent.episodeNumber.replace(/[^0-9]/g, ''));

                        console.log(seriesId, "contentId===")
                        console.log(season, "season===")
                        console.log(episode, "episode===")

                        await db.insert(seriesMetadata).values({
                            seriesId,
                            memoCardId: newMemoCard.id,
                            season: season,
                            episode: episode,
                            episodeTitle: contextContent.episodeTitle || null,
                            watchId
                        });
                    }
                }
                await db.insert(userActionLogs).values({
                    userId: session.user.id,
                    actionType: "CREATE_MEMO",
                    relatedId: newMemoCard.id,
                    relatedType: "memo_card"
                });
            } catch (error) {
                // 记录错误但不影响主流程
                console.error("处理记忆卡片相关元数据时出错:", error);
            }
        })();
    }

    return JSON.stringify(newMemoCard);
}
