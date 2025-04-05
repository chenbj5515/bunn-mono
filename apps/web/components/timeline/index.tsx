"use client"

import { useState } from "react"
import { MemoCard } from "@/components/memo-card"
import { Clock } from 'lucide-react'
import { cn } from "ui/lib/utils"
import { Card } from "ui/components/card"
import dayjs from "dayjs"
import { memoCard } from "@db/schema"
import type { InferSelectModel } from "drizzle-orm"
import Image from "next/image"

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
    alwaysShowTimestamp?: boolean // 控制时间戳是否永远显示
}

export default function Timeline({ memoCards, alwaysShowTimestamp = false }: TimelineProps) {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null)
    
    // 获取第一个卡片的封面和标题用于固定展示
    const firstCard = memoCards.length > 0 ? memoCards[0] : null;
    const coverUrl = firstCard?.coverUrl || "";
    const seriesTitle = firstCard?.seriesTitle || "";

    return (
        <div className="relative min-h-screen font-mono">
            {/* 左侧固定封面图片和标题 */}
            <div className="hidden top-1/2 left-0 z-10 fixed md:flex flex-col items-center p-6 w-1/4 -translate-y-1/2">
                {coverUrl && (
                    <div className="relative mb-4 w-full h-80">
                        <Image 
                            src={`/series/${coverUrl}`} 
                            alt={seriesTitle || "封面图片"} 
                            fill
                            className="object-contain"
                        />
                    </div>
                )}
                <h3 className="mt-2 font-semibold text-xl text-center">
                    {seriesTitle || ""}
                </h3>
            </div>

            {/* 中央时间轴部分 - 绝对定位在页面中央 */}
            <div className="top-0 bottom-0 left-1/2 z-20 fixed w-3 -translate-x-1/2">
                {/* 时间轴线 */}
                <div className="bg-white shadow-neumorphic-weak w-full h-full" />
            </div>

            {/* 右侧卡片内容区域 - 定位在右半部分居中 */}
            <div className="space-y-24 ml-auto px-4 py-10 md:pr-8 w-full md:w-1/2">
                {memoCards.map((card, index) => {
                    // 格式化时间戳
                    const date = card.createTime
                        ? dayjs(card.createTime).format('YYYY-MM-DD')
                        : '';
                    const time = card.createTime
                        ? dayjs(card.createTime).format('HH:mm:ss')
                        : '';

                    return (
                        <div key={index} className="relative">
                            {/* 节点 - 纵向与卡片中点对齐，横向与屏幕中央（时间轴）对齐 */}
                            <div
                                className="top-1/2 z-30 absolute bg-white shadow-neumorphic-weak rounded-full w-6 h-6 transition-all -translate-y-1/2 duration-200 cursor-pointer"
                                style={{
                                    position: 'absolute',
                                    left: '-29px',
                                }}
                                onMouseEnter={() => setHoveredNode(index)}
                                onMouseLeave={() => setHoveredNode(null)}
                            />

                            {/* 时间戳显示 - 悬停时显示 */}
                            {(alwaysShowTimestamp || hoveredNode === index) && (
                                <div className="top-1/2 right-[calc(100%+46px)] left-auto z-40 absolute flex flex-col justify-between items-center bg-white shadow-[0_5px_15px_rgba(0,0,0,0.07)] px-4 py-3 rounded-md w-[130px] h-[84px] text-base transition-opacity -translate-y-1/2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{date}</span>
                                    </div>
                                    <span>{time}</span>
                                </div>
                            )}

                            {/* 移动端封面图片和标题 */}
                            <div className="md:hidden flex flex-col items-center mb-4">
                                {card.coverUrl && (
                                    <div className="relative w-full h-64">
                                        <Image 
                                            src={`/series/${card.coverUrl}`} 
                                            alt={card.seriesTitle || "封面图片"} 
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                <h3 className="mt-2 font-semibold text-xl text-center">
                                    {card.seriesTitle || ""}
                                </h3>
                            </div>
                            
                            {/* 卡片内容 */}
                            <>
                                {/* 剧集信息 */}
                                {card.season && card.episode && (
                                    <div className="mb-5 text-[18px] text-center tracking-[0.5px]">
                                        第{card.season}季第{card.episode}集{card.episodeTitle ? `: ${card.episodeTitle}` : ''}
                                    </div>
                                )}
                                <MemoCard
                                    {...card}
                                    weakBorder={true}
                                    hideCreateTime={true}
                                />
                            </>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
