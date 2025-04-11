import { FC } from 'react'
import { db } from "@server/db/index"
import { channels, channelVideoMetadata, characters, memoCard } from "@server/db/schema"
import { and, eq, InferSelectModel } from "drizzle-orm"
import { getSession } from '@server/lib/auth'
import { cookies } from 'next/headers'
import ChannelDetailClient from './channel-detail-client'

// 定义默认位置
const DEFAULT_POSITIONS = {
  banner: { x: 0, y: 0 },
  avatar: { x: 0, y: 200 },
  title: { x: 150, y: 200 }
};

// 定义默认大小
const DEFAULT_SIZES = {
  banner: { width: 1070, height: 172 },
  avatar: { width: 96, height: 96 },
  title: { width: 300, height: 50 }
};

export interface ChannelDetailPageProps {
  params: {
    locale: string
    channelId: string
  }
}

export interface MemoCardWithChannel extends InferSelectModel<typeof memoCard> {
  character: InferSelectModel<typeof characters> | null
  videoId: string,
  videoTitle: string,
}

const ChannelDetailPage: FC<ChannelDetailPageProps> = async ({ params }) => {
  const { channelId: encodedChannelId } = await params
  // 对channelId进行解码，处理特殊字符
  const channelId = decodeURIComponent(encodedChannelId)
  
  console.log('原始channelId:', encodedChannelId)
  console.log('解码后channelId:', channelId)

  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  // 从数据库获取频道详细信息
  let channelDetail = null
  let memoCardList: MemoCardWithChannel[] = []

  try {
    // 获取频道信息
    const channelData = await db
      .select({
        channelId: channels.channelId,
        channelName: channels.channelName,
        avatarUrl: channels.avatarUrl,
        description: channels.description,
        bannerUrl: channels.bannerUrl,
      })
      .from(channels)
      .where(eq(channels.channelId, channelId))
      .limit(1)

    if (channelData.length > 0) {
      channelDetail = channelData[0]

      // 获取与该频道相关的视频数据，同时包含memoCard的所有字段
      const memoCardsData = await db
        .select({
          // memoCard的所有字段
          id: memoCard.id,
          translation: memoCard.translation,
          createTime: memoCard.createTime,
          updateTime: memoCard.updateTime,
          recordFilePath: memoCard.recordFilePath,
          originalText: memoCard.originalText,
          reviewTimes: memoCard.reviewTimes,
          forgetCount: memoCard.forgetCount,
          userId: memoCard.userId,
          kanaPronunciation: memoCard.kanaPronunciation,
          contextUrl: memoCard.contextUrl,
          rubyTranslations: memoCard.rubyTranslations,
          platform: memoCard.platform,
          seriesId: memoCard.seriesId,
          characterId: memoCard.characterId,
          // channelVideoMetadata的字段
          channelId: channelVideoMetadata.channelId,
          metadataId: channelVideoMetadata.id, // 作为MemoCardWithMetadata需要的metadataId
          thumbnailUrl: channelVideoMetadata.thumbnailUrl,
          videoId: channelVideoMetadata.videoId,
          videoTitle: channelVideoMetadata.videoTitle,
          // characters表的字段
          character: characters,
        })
        .from(memoCard)
        .innerJoin(
          channelVideoMetadata,
          eq(memoCard.id, channelVideoMetadata.memoCardId)
        )
        .leftJoin(
          characters,
          eq(memoCard.characterId, characters.id)
        )
        .where(
          and(
            eq(channelVideoMetadata.channelId, channelId),
            eq(memoCard.userId, session.user.id),
            eq(memoCard.platform, 'youtube')
          )
        )
        .orderBy(memoCard.createTime)

      memoCardList = memoCardsData
    }
  } catch (error) {
    console.error("Failed to fetch channel details:", error)
  }

  if (!channelDetail) {
    // 如果找不到频道信息，可以返回一个404页面或错误信息
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="font-bold text-2xl">频道未找到</h1>
      </div>
    )
  }

  // 从cookie获取位置信息
  const cookieStore = await cookies();
  let bannerPosition = DEFAULT_POSITIONS.banner;
  let avatarPosition = DEFAULT_POSITIONS.avatar;
  let titlePosition = DEFAULT_POSITIONS.title;
  let bannerSize = DEFAULT_SIZES.banner;
  let avatarSize = DEFAULT_SIZES.avatar;
  let titleSize = DEFAULT_SIZES.title;

  // 尝试获取横幅位置
  const bannerPositionCookie = cookieStore.get(`cover_position_${encodedChannelId}`);
  if (bannerPositionCookie && bannerPositionCookie.value) {
    try {
      bannerPosition = JSON.parse(bannerPositionCookie.value);
    } catch (error) {
      console.error("Failed to parse banner position:", error);
    }
  }

  // 尝试获取头像位置
  const avatarPositionCookie = cookieStore.get(`title_position_${channelId}`);
  if (avatarPositionCookie && avatarPositionCookie.value) {
    try {
      avatarPosition = JSON.parse(avatarPositionCookie.value);
    } catch (error) {
      console.error("Failed to parse avatar position:", error);
    }
  }

  // 尝试获取标题位置
  const titlePositionCookie = cookieStore.get(`title_text_position_${encodedChannelId}`);
  if (titlePositionCookie && titlePositionCookie.value) {
    try {
      titlePosition = JSON.parse(titlePositionCookie.value);
    } catch (error) {
      console.error("Failed to parse title position:", error);
    }
  }

  // 尝试获取横幅大小
  const bannerSizeCookie = cookieStore.get(`cover_size_${encodedChannelId}`);
  if (bannerSizeCookie && bannerSizeCookie.value) {
    try {
      bannerSize = JSON.parse(bannerSizeCookie.value);
    } catch (error) {
      console.error("Failed to parse banner size:", error);
    }
  }

  // 尝试获取头像大小
  const avatarSizeCookie = cookieStore.get(`title_size_${encodedChannelId}`);
  if (avatarSizeCookie && avatarSizeCookie.value) {
    try {
      avatarSize = JSON.parse(avatarSizeCookie.value);
    } catch (error) {
      console.error("Failed to parse avatar size:", error);
    }
  }

  // 尝试获取标题大小
  const titleSizeCookie = cookieStore.get(`title_text_size_${encodedChannelId}`);
  if (titleSizeCookie && titleSizeCookie.value) {
    try {
      titleSize = JSON.parse(titleSizeCookie.value);
    } catch (error) {
      console.error("Failed to parse title size:", error);
    }
  }

  // 将数据传递给客户端组件
  return (
    <ChannelDetailClient 
      channelDetail={channelDetail} 
      memoCardList={memoCardList} 
      bannerPosition={bannerPosition}
      avatarPosition={avatarPosition}
      titlePosition={titlePosition}
      bannerSize={bannerSize}
      avatarSize={avatarSize}
      titleSize={titleSize}
    />
  )
}

export default ChannelDetailPage 