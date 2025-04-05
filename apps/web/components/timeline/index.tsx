"use client"

import { useState } from "react"
import { MemoCard } from "@/components/memo-card"
import { Clock } from 'lucide-react'
import { cn } from "ui/lib/utils"
import { Card } from "ui/components/card"
import dayjs from "dayjs"
import { memoCard } from "@db/schema"
import type { InferSelectModel } from "drizzle-orm"

// 定义 MemoCardWithMetadata 类型，包含从数据库获取的 MemoCard 和额外的元数据
export interface MemoCardWithMetadata extends InferSelectModel<typeof memoCard> {
    // 元数据字段
    season?: number | null
    episode?: number | null
    episodeTitle?: string | null
    // 额外添加的字段
    seriesTitle?: string
    coverUrl?: string
}

interface TimelineProps {
    memoCards: MemoCardWithMetadata[]
}

export default function Timeline({ memoCards }: TimelineProps) {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null)

    console.log(memoCards, "memoCards========")
    return (
        <div className="relative">
            {/* 中央时间线 */}
            <div className="top-0 bottom-0 left-1/2 absolute bg-gray-300 w-1 -translate-x-1/2" />

            <div className="space-y-24">
                {memoCards.map((card, index) => {
                    // 构建标题 - 使用season、episode和episodeTitle (如果有)
                    let title = card.seriesTitle || "";
                    if (card.season && card.episode) {
                        title = `${card.seriesTitle} S${card.season}E${card.episode}`;
                        if (card.episodeTitle) {
                            title += ` - ${card.episodeTitle}`;
                        }
                    }

                    // 格式化时间戳
                    const timestamp = card.createTime
                        ? dayjs(card.createTime).format('YYYY-MM-DD HH:mm')
                        : '';

                    // 确定位置
                    const position = index % 2 === 0 ? "left" : "right";

                    return (
                        <div key={index} className="relative">
                            {/* 时间线节点 - 添加交互 */}
                            <div
                                className="top-6 left-1/2 z-10 absolute bg-gray-300 hover:bg-gray-500 rounded-full w-4 h-4 transition-colors -translate-x-1/2 duration-200 cursor-pointer"
                                onMouseEnter={() => setHoveredNode(index)}
                                onMouseLeave={() => setHoveredNode(null)}
                            />

                            {/* 时间戳显示 - 在对侧显示 */}
                            {hoveredNode === index && (
                                <div className={cn(
                                    "absolute top-5 z-20 bg-white shadow-md rounded-md py-1 px-3 flex items-center gap-1 text-sm transition-opacity duration-200",
                                    position === "left" ? "left-[calc(50%+1rem)]" : "right-[calc(50%+1rem)]"
                                )}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{timestamp}</span>
                                </div>
                            )}

                            {/* 卡片内容 */}
                            <div className={cn(
                                "grid grid-cols-1 md:grid-cols-2 gap-4",
                                position === "left" ? "md:grid-flow-dense" : ""
                            )}>
                                {/* 左侧卡片 */}
                                {position === "left" ? (
                                    <>
                                        <div className="p-6">
                                            <MemoCard
                                                {...card}
                                                weakBorder={true}
                                                hideCreateTime={true}
                                            />
                                        </div>
                                        <div className="hidden md:block" />
                                    </>
                                ) : (
                                    <>
                                        <div className="hidden md:block" />
                                        <MemoCard
                                            {...card}
                                            weakBorder={true}
                                            hideCreateTime={true}
                                        />
                                    </>
                                )}
                            </div>

                            {/* 移动端标题显示 */}
                            <div className="md:hidden mt-2 font-medium text-center">
                                {title}
                            </div>
                        </div>
                    )
                })}

                {/* 时间线底部节点 */}
                {/* <div className="bottom-0 left-1/2 absolute bg-gray-300 rounded-full w-4 h-4 -translate-x-1/2" /> */}
            </div>
        </div>
    )
}
