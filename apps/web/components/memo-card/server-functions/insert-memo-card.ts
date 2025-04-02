"use server"
import { getSession } from "@server/lib/auth";
import { db } from "@db/index";
import { memoCard, userActionLogs, series, seriesMetadata } from "@db/schema";
import { sql, eq, and } from "drizzle-orm";
import { ContextContent } from '@/components/input-box';
import { client } from "@server/lib/api-client";

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
    if (!session?.user.id) {
        return null;
    }

    // 默认值
    let contentType: string | null = null;
    let contentId: string | null = null;

    // 处理Netflix URL
    if (url && url.includes('netflix.com/watch')) {
        const watchID = extractNetflixWatchID(url);
        if (watchID) {
            contentType = "netflix series";

            // 检查series表中是否已存在该watchID的记录
            const existingSeries = await db.select()
                .from(series)
                .where(
                    and(
                        eq(series.platform, "netflix"),
                        eq(series.relatedId, watchID)
                    )
                )
                .limit(1);

            // 如果不存在，则创建新记录
            if (existingSeries.length === 0) {
                // 获取series标题
                // 注意：这里假设contextContent可能包含一个name或其他标识符
                const seriesTitle = contextContent?.seriesTitle || ""
                
                // 默认封面URL为空字符串
                let coverUrl = "";
                
                try {
                    // 调用crawler API获取封面URL - 目前未实现
                    // 这是一个保留的位置，未来实现获取封面功能
                    // TODO: 实现获取剧集封面功能
                    console.log("未来这里将获取封面URL:", seriesTitle);
                } catch (error) {
                    console.error("获取剧集封面失败:", error);
                }
                
                // 使用Promise.all并行获取中文和英文译名
                const [zhTitle, zhTWTitle,enTitle] = await Promise.all([
                    client.api.ai["generate-text"].$post({
                        json: {
                            prompt: `给出${seriesTitle}」这个动画的中文译名，只给出译名文本，不要任何其他内容 `,
                        }
                    }).then(async response => {
                        const result = await response.json();
                        return result.success ? result.data : "";
                    }),

                    client.api.ai["generate-text"].$post({
                        json: {
                            prompt: `给出${seriesTitle}」这个动画的台湾版繁体字译名，只给出译名的文本，不要任何其他内容 `,
                        }
                    }).then(async response => {
                        const result = await response.json();
                        return result.success ? result.data : "";
                    }),
                    
                    client.api.ai["generate-text"].$post({
                        json: {
                            prompt: `给出${seriesTitle}」这个动画的英文译名，只给出译名文本，不要任何其他内容 `,
                        }
                    }).then(async response => {
                        const result = await response.json();
                        return result.success ? result.data : "";
                    })
                ]);

                console.log(zhTitle, "zhTitle===")
                console.log(enTitle, "enTitle===")
                
                const [newSeries] = await db.insert(series).values({
                    relatedId: watchID,
                    platform: "netflix",
                    coverUrl,
                    titles: {
                        "zh": zhTitle,
                        "zh-TW": zhTWTitle,
                        "en": enTitle
                    }
                }).returning();

                if (newSeries) {
                    contentId = newSeries.id;
                }
            } else if (existingSeries[0]) {
                // 使用已存在的series记录
                contentId = existingSeries[0].id;
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
        contentType,
        contentId
    }).returning();

    // 异步处理后续操作，不等待完成
    if (newMemoCard) {
        // 使用void操作符忽略Promise结果，使后续操作异步执行
        void (async () => {
            try {
                // 确保newMemoCard存在，并且有contentId（表示这是一个剧集相关的记忆卡片）
                if (contentId && contextContent) {
                    // 创建用户行为日志
                    await db.insert(userActionLogs).values({
                        userId: session.user.id,
                        actionType: "CREATE_MEMO",
                        relatedId: newMemoCard.id,
                        relatedType: "memo_card"
                    });

                    // 检查是否需要添加series_metadata记录
                    if (contextContent.seriesNum && contextContent.episodeNumber) {
                        const season = parseInt(contextContent.seriesNum);
                        const episode = parseInt(contextContent.episodeNumber.replace(/[^0-9]/g, ''));

                        console.log(contentId, "contentId===")
                        console.log(season, "season===")
                        console.log(episode, "episode===")
                        // 检查是否已存在匹配的记录
                        const existingMetadata = await db.select()
                            .from(seriesMetadata)
                            .where(
                                and(
                                    eq(seriesMetadata.seriesId, contentId),
                                    eq(seriesMetadata.season, season),
                                    eq(seriesMetadata.episode, episode)
                                )
                            )
                            .limit(1);

                        // 如果不存在记录，则创建新记录
                        if (existingMetadata.length === 0) {
                            await db.insert(seriesMetadata).values({
                                seriesId: contentId,
                                memoCardId: newMemoCard.id,
                                season: season,
                                episode: episode,
                                episodeTitle: contextContent.episodeTitle || null
                            });
                        }
                    }
                } else {
                    // 如果不是剧集相关的，只创建用户行为日志
                    await db.insert(userActionLogs).values({
                        userId: session.user.id,
                        actionType: "CREATE_MEMO",
                        relatedId: newMemoCard.id,
                        relatedType: "memo_card"
                    });
                }
            } catch (error) {
                // 记录错误但不影响主流程
                console.error("处理记忆卡片相关元数据时出错:", error);
            }
        })();
    }

    return JSON.stringify(newMemoCard);
}
