import { FC } from 'react'
import SeriesListClient from './series-list-client'
import { db } from "@db/index"
import { memoCard, series, userSeriesCovers } from "@db/schema"
import { and, eq } from "drizzle-orm"
import { getSession } from '@server/lib/auth'
import { Poster } from '@/components/poster-card'

// 在这里添加导出接口关键字，以便客户端组件可以导入
export interface SeriesListPageProps {
  params: {
    locale: string
    platform: string
  }
}

// 不再需要在这里定义Poster类型
// 使用从 @/components/poster-card 导入的 Poster 类型

// 服务器组件现在是 async 函数
const SeriesListPage = async ({ params }: SeriesListPageProps) => {
  const { platform } = await params

  const session = await getSession()

  if (!session) {
    return new Error("Unauthorized")
  }

  // 1. 从数据库获取数据
  let seriesList: Poster[] = []
  try {
    // 使用 Drizzle 查询与特定用户、平台相关的 memoCard 关联的 series 数据
    const seriesData = await db
      .select({
        id: series.id,
        title: series.title,
        coverUrl: series.coverUrl,
      })
      .from(series)
      .innerJoin(memoCard, eq(series.id, memoCard.seriesId))
      .where(
        and(
          eq(memoCard.userId, session.user.id),
          eq(memoCard.platform, platform)
        )
      )
      .groupBy(series.id) // 确保结果去重

    // 2. 获取用户自定义封面数据
    const userCovers = await db
      .select({
        seriesId: userSeriesCovers.seriesId,
        customCoverUrl: userSeriesCovers.customCoverUrl,
      })
      .from(userSeriesCovers)
      .where(eq(userSeriesCovers.userId, session.user.id))

    // 创建一个映射以便于查找
    const userCoversMap = new Map()
    userCovers.forEach(cover => {
      userCoversMap.set(cover.seriesId, cover.customCoverUrl)
    })

    // 3. 将结果转换为所需的 Poster 格式，优先使用自定义封面
    seriesList = seriesData.map((item: { id: string; title: string; coverUrl: string }) => ({
      id: item.id,
      src: userCoversMap.has(item.id) ? userCoversMap.get(item.id) : item.coverUrl,
      title: item.title,
    }))

  } catch (error) {
    console.error("Failed to fetch series data:", error)
    // 在出错时返回空数组
    seriesList = []
  }

  // 4. 将数据传递给客户端组件
  return <SeriesListClient posterImages={seriesList} />
}

export default SeriesListPage 