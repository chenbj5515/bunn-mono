import { FC } from 'react';
import { db } from "@db/index";
import { memoCard, series, seriesMetadata, userSeriesCovers } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from '@server/lib/auth';
import Timeline, { MemoCardWithMetadata } from '@/components/timeline';
import dayjs from 'dayjs';

export interface TimelinePageProps {
  params: {
    locale: string;
    seriesId: string;
  }
}

const TimelinePage: FC<TimelinePageProps> = async ({ params }) => {
  const { seriesId } = await params;

  const session = await getSession();

  if (!session) {
    throw new Error("未授权访问");
  }

  let memoCards: MemoCardWithMetadata[] = [];
  let seriesTitle = "";
  let coverUrl = "";

  try {
    // 获取系列信息，包括基本信息和自定义封面
    const seriesData = await db
      .select({
        id: series.id,
        title: series.title,
        coverUrl: series.coverUrl,
      })
      .from(series)
      .where(eq(series.id, seriesId))
      .limit(1);

    if (seriesData.length > 0) {
      seriesTitle = seriesData[0]?.title || "";
      coverUrl = seriesData[0]?.coverUrl || "";

      // 检查是否有自定义封面
      const customCoverData = await db
        .select({
          customCoverUrl: userSeriesCovers.customCoverUrl,
        })
        .from(userSeriesCovers)
        .where(
          and(
            eq(userSeriesCovers.seriesId, seriesId),
            eq(userSeriesCovers.userId, session.user.id)
          )
        )
        .limit(1);

      if (customCoverData.length > 0 && customCoverData[0]?.customCoverUrl) {
        coverUrl = customCoverData[0]?.customCoverUrl;
      }
    }

    // 获取该系列的所有memoCard数据，以及关联的metadata
    const memoCardsData = await db
      .select({
        // memoCard 的全部字段
        id: memoCard.id,
        content: memoCard.originalText,
        createTime: memoCard.createTime,
        updateTime: memoCard.updateTime,
        platform: memoCard.platform,
        seriesId: memoCard.seriesId,
        userId: memoCard.userId,
        originalText: memoCard.originalText,
        // 添加缺失的字段
        translation: memoCard.translation,
        recordFilePath: memoCard.recordFilePath,
        reviewTimes: memoCard.reviewTimes,
        forgetCount: memoCard.forgetCount,
        kanaPronunciation: memoCard.kanaPronunciation,
        contextUrl: memoCard.contextUrl,
        // 从series_metadata获取额外信息
        season: seriesMetadata.season,
        episode: seriesMetadata.episode,
        episodeTitle: seriesMetadata.episodeTitle,
      })
      .from(memoCard)
      .leftJoin(
        seriesMetadata, 
        eq(memoCard.id, seriesMetadata.memoCardId)
      )
      .where(
        and(
          eq(memoCard.seriesId, seriesId),
          eq(memoCard.userId, session.user.id)
        )
      )
      .orderBy(memoCard.createTime);

    // 为每个 memoCard 添加系列标题、封面 URL 和翻译文本
    memoCards = memoCardsData.map(card => ({
      ...card,
      translatedText: null, // 根据需要设置翻译文本
      seriesTitle,
      coverUrl,
      // 确保 originalText 不为 null
      originalText: card.originalText || "",
    }));
  } catch (error) {
    console.error("获取时间线数据失败:", error);
    memoCards = [];
  }

  if (!seriesTitle) {
    return <div className="mx-auto p-8 container">系列不存在或无权访问</div>;
  }

  return <Timeline memoCards={memoCards} />;
};

export default TimelinePage; 