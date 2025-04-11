import { FC } from 'react'
import { db } from "@server/db/index"
import { channels, channelVideoMetadata, memoCard } from "@server/db/schema"
import { and, eq } from "drizzle-orm"
import { getSession } from '@server/lib/auth'
import { cookies } from 'next/headers'
import ChannelDetailClient from './channel-detail-client'

// 定义位置类型
interface Position {
  x: number;
  y: number;
}

// 定义默认位置
const DEFAULT_POSITIONS = {
  banner: { x: 0, y: 0 },
  avatar: { x: 0, y: 200 },
  title: { x: 150, y: 200 }
};

export interface ChannelDetailPageProps {
  params: {
    locale: string
    channelId: string
  }
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
  let videoList: any[] = []

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

    console.log(channelData, channelId, "channelId===")

    if (channelData.length > 0) {
      channelDetail = channelData[0]

      // 获取与该频道相关的视频数据
      const videosData = await db
        .select({
          id: memoCard.id,
          originalText: memoCard.originalText,
          thumbnailUrl: channelVideoMetadata.thumbnailUrl,
          platform: memoCard.platform,
          videoId: channelVideoMetadata.videoId,
          videoTitle: channelVideoMetadata.videoTitle,
          createTime: memoCard.createTime,
        })
        .from(memoCard)
        .innerJoin(
          channelVideoMetadata,
          eq(memoCard.id, channelVideoMetadata.memoCardId)
        )
        .where(
          and(
            eq(channelVideoMetadata.channelId, channelId),
            eq(memoCard.userId, session.user.id),
            eq(memoCard.platform, 'youtube')
          )
        )
        .orderBy(memoCard.createTime)

      videoList = videosData
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

  // 尝试获取横幅位置
  const bannerCookie = cookieStore.get('banner_position');
  if (bannerCookie && bannerCookie.value) {
    try {
      bannerPosition = JSON.parse(bannerCookie.value);
    } catch (error) {
      console.error("Failed to parse banner position:", error);
    }
  }

  // 尝试获取头像位置
  const avatarCookie = cookieStore.get('avatar_position');
  if (avatarCookie && avatarCookie.value) {
    try {
      avatarPosition = JSON.parse(avatarCookie.value);
    } catch (error) {
      console.error("Failed to parse avatar position:", error);
    }
  }

  // 尝试获取标题位置
  const titleCookie = cookieStore.get('title_position');
  if (titleCookie && titleCookie.value) {
    try {
      titlePosition = JSON.parse(titleCookie.value);
    } catch (error) {
      console.error("Failed to parse title position:", error);
    }
  }

  // 将数据传递给客户端组件
  return (
    <ChannelDetailClient 
      channelDetail={channelDetail} 
      videoList={videoList} 
      bannerPosition={bannerPosition}
      avatarPosition={avatarPosition}
      titlePosition={titlePosition}
    />
  )
}

export default ChannelDetailPage 