import { FC } from 'react'
import ChannelsClient, { Channel } from './channels-client'
import { db } from "@db/index"
import { memoCard, channels, channelVideoMetadata } from "@db/schema"
import { and, eq } from "drizzle-orm"
import { getSession } from '@server/lib/auth'
import { cookies } from 'next/headers'

export interface ChannelsPageProps {
  params: {
    locale: string
  }
}

const ChannelsPage = async ({ params }: ChannelsPageProps) => {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  // 获取 cookie 中保存的位置数据
  let savedPositions = {}
  
  try {
    // Next.js 15 中 cookies() 是异步函数
    const cookieStore = await cookies()
    const savedPositionsCookie = cookieStore.get('channel_positions')
    
    if (savedPositionsCookie?.value) {
      savedPositions = JSON.parse(savedPositionsCookie.value)
    }
  } catch (error) {
    console.error("Failed to get or parse saved positions from cookie:", error)
  }

  // 从数据库获取数据
  let channelsList: Channel[] = []
  try {
    // 使用 Drizzle 查询与特定用户、平台为youtube的 memoCard 关联的 channels 数据
    const channelsData = await db
      .select({
        channelId: channels.channelId,
        channelName: channels.channelName,
        avatarUrl: channels.avatarUrl,
      })
      .from(channels)
      .innerJoin(
        channelVideoMetadata,
        eq(channels.channelId, channelVideoMetadata.channelId)
      )
      .innerJoin(
        memoCard,
        eq(channelVideoMetadata.memoCardId, memoCard.id)
      )
      .where(
        and(
          eq(memoCard.userId, session.user.id),
          eq(memoCard.platform, 'youtube')
        )
      )
      .groupBy(channels.channelId) // 确保结果去重

    // 将结果转换为所需的 Channel 格式
    channelsList = channelsData.map((item) => ({
      channelId: item.channelId,
      channelName: item.channelName,
      avatarUrl: item.avatarUrl
    }))

  } catch (error) {
    console.error("Failed to fetch channels data:", error)
    // 在出错时返回空数组
    channelsList = []
  }

  console.log(channelsList, "channelsList=====");

  // 将数据传递给客户端组件，包括从cookie获取的位置数据
  return <ChannelsClient channels={channelsList} savedPositions={savedPositions} />
}

export default ChannelsPage
