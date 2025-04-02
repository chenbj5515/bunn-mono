import { FC } from 'react'
import SeriesListClient from './series-list-client'
import { db } from "@db/index"
import { memoCard, series } from "@db/schema"
import { and, eq } from "drizzle-orm"
import { getSession } from '@server/lib/auth'

// 在这里添加导出接口关键字，以便客户端组件可以导入
export interface SeriesListPageProps {
  params: {
    locale: string
    platform: string
  }
}

// 定义海报类型并导出
export interface Poster {
  id: string
  src: string
  title: string
}

// 服务器组件现在是 async 函数
const SeriesListPage = async ({ params }: SeriesListPageProps) => {
  const { platform } = params

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

    // 2. 将结果转换为所需的 Poster 格式
    seriesList = seriesData.map((item: { id: string; title: string; coverUrl: string }) => ({
      id: item.id,
      src: item.coverUrl,
      title: item.title,
    }))

  } catch (error) {
    console.error("Failed to fetch series data:", error)
    // 在出错时返回空数组
    seriesList = []
  }

  // 3. 将数据传递给客户端组件
  return <SeriesListClient posterImages={seriesList} />
}

export default SeriesListPage 