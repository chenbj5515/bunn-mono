import { FC } from 'react';
import { db } from "@db/index";
import { memoCard, series, seriesMetadata, userSeriesMaterials } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from '@server/lib/auth';
import Timeline, { MemoCardWithMetadata } from '@/components/timeline';
import { cookies } from 'next/headers';
import sizeOf from 'image-size';

// 导入获取远程图片尺寸的工具函数
async function getImageDimensions(url: string, type: 'cover' | 'title'): Promise<{ aspectRatio: number } | null> {
  if (!url) return null;

  try {
    // 如果URL是相对路径，需要处理成完整的URL
    const isRelativePath = !url.startsWith('http');
    const fullUrl = isRelativePath ? `${process.env.NEXT_PUBLIC_APP_URL}/${type === 'cover' ? 'series' : 'titles'}/${url}` : url;
    
    console.log(fullUrl, "fullUrl=====");
    // 获取图片数据
    const response = await fetch(fullUrl, { method: 'GET' });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 使用image-size获取尺寸
    const dimensions = sizeOf(buffer);
    
    if (dimensions.width && dimensions.height) {
      const aspectRatio = dimensions.width / dimensions.height;
      return { aspectRatio };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

export interface TimelinePageProps {
  params: {
    locale: string;
    seriesId: string;
  }
}

// 定义元素样式类型
interface ElementStyle {
  position: { x: number; y: number } | null;
  size: { width: number; height: number } | null;
}

// 定义元素样式集合类型
interface ElementsStyleProps {
  [key: string]: ElementStyle;
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
  let titleUrl = "";
  let coverAspectRatio: number | null = null;
  let titleAspectRatio: number | null = null;

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
      // titleUrl = seriesData[0]?.coverUrl || "";

      // 检查是否有自定义封面
      const customCoverData = await db
        .select({
          customCoverUrl: userSeriesMaterials.customCoverUrl,
          titleUrl: userSeriesMaterials.customTitleUrl,
        })
        .from(userSeriesMaterials)
        .where(
          and(
            eq(userSeriesMaterials.seriesId, seriesId),
            eq(userSeriesMaterials.userId, session.user.id)
          )
        )
        .limit(1);

      if (customCoverData.length > 0) {
        if (customCoverData[0]?.customCoverUrl) {
          coverUrl = customCoverData[0].customCoverUrl;
        }
        if (customCoverData[0]?.titleUrl) {
          titleUrl = customCoverData[0].titleUrl;
        }
      }

      // 获取图片的长宽比
      if (coverUrl) {
        const dimensions = await getImageDimensions(coverUrl, 'cover');
        coverAspectRatio = dimensions?.aspectRatio || null;
      }
      
      if (titleUrl) {
        const dimensions = await getImageDimensions(titleUrl, 'title');
        titleAspectRatio = dimensions?.aspectRatio || null;
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
      // 移除这两个字段，它们将作为独立参数传递
      // seriesTitle,
      // coverUrl,
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

  // 从cookie中读取元素位置和大小信息
  const cookieStore = await cookies();
  
  // 定义需要读取的元素列表
  const elements = ['title', 'cover'];
  const elementsStyle = {} as ElementsStyleProps;
  
  // 遍历所有元素获取它们的位置和大小
  for (const element of elements) {
    const isImage = ['title', 'cover'].includes(element);
    const prefix = isImage ? 'image' : 'text';
    
    // 构建cookie键名
    const positionKey = `${prefix}_position_timeline_${element}_${seriesId}`;
    const sizeKey = `${prefix}_size_timeline_${element}_${seriesId}`;
    
    // 获取cookie
    const positionCookie = cookieStore.get(positionKey);
    const sizeCookie = cookieStore.get(sizeKey);
    
    // 解析cookie值
    const position = positionCookie?.value ? JSON.parse(positionCookie.value) : null;
    const size = sizeCookie?.value ? JSON.parse(sizeCookie.value) : null;
    
    // 只有当至少有一个值存在时才添加到elementsStyle
    if (position || size) {
      // 将下划线分隔的键转换为驼峰式
      // const camelKey = element.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      elementsStyle[element] = { position, size };
    }
  }
  
  console.log(coverAspectRatio, "coverAspectRatio=====");
  console.log(coverUrl, "coverUrl=====");
  // 将样式信息传递给Timeline组件
  return <Timeline 
    memoCards={memoCards} 
    seriesId={seriesId} 
    elementsStyle={elementsStyle} 
    seriesTitle={seriesTitle}
    coverUrl={coverUrl}
    titleUrl={titleUrl}
    coverAspectRatio={coverAspectRatio}
    titleAspectRatio={titleAspectRatio}
  />;
};

export default TimelinePage; 