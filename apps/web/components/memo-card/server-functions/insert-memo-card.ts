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

export async function insertMemoCard(
    originalText: string,
    translation: string,
    pronunciation: string,
    url: string,
    contextContent: ContextContent | null
) {
    const session = await getSession();
    const headersList = await headers();

    // console.log(headersList, "insertMemoCard session================")
    if (!session?.user.id) {
        return null;
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
                    'attack-on-titan.jpg',
                    'cyberpunk.png',
                    'dragon-ball.webp',
                    'eva.avif',
                    'flower.jpeg',
                    'hunter-x-hunter.webp',
                    'jujutsu-kaisen.webp',
                    'konann.jpg',
                    'one-punch-man.webp',
                    'seven-deadly-sins.webp',
                    'summer-time-rerendering.webp',
                    'weather-child.png',
                    'your-name.jpeg'
                ];

                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': headersList.get('cookie') || ''
                    },
                    body: JSON.stringify({
                        prompt: `如果${seriesList}」这个列表里有一个元素对应${seriesTitle}这个剧集，返回这个元素的值，不要返回任何其他内容。如果找不到一个元素对应，那么返回空字符串。 `
                    })
                });

                const result = await response.json();
                const seriesCover = result.success ? result.data : "";

                const [newSeries] = await db.insert(series).values({
                    platform: "netflix",
                    coverUrl: seriesCover,
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
