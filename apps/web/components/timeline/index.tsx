"use client"

import { useState, useEffect } from "react"
import { MemoCard } from "@/components/memo-card"
import dayjs from "dayjs"
import { memoCard } from "@db/schema"
import type { InferSelectModel } from "drizzle-orm"
import { ResizableText } from "./resizable-text"
import { ResizableImage } from "./resizable-image"

// 添加一个自定义CSS类名，用于禁用文本选择
const noSelectClass = "select-none";

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

    // 添加页面级别的禁用文本选择功能
    useEffect(() => {
        // 添加全局样式来禁用文本选择
        document.body.style.userSelect = 'none';

        return () => {
            // 组件卸载时恢复文本选择
            document.body.style.userSelect = '';
        };
    }, []);

    return (
        <div className={`relative min-h-screen font-mono ${noSelectClass}`}>
            {/* 固定位置的标题、文字和海报 */}
            <ResizableImage
                src={"/titles/cyberpunk.png"}
                alt="cyberpunk"
                width={400}
                height={100}
                initialPosition={{ x: 280, y: 10 }}
                showShadow={false}
            />

            <ResizableImage
                src={"/assets/quotes.png"}
                alt="cyberpunk"
                width={40}
                height={40}
                initialPosition={{ x: 420, y: 180 }}
                showShadow={false}
            />

            {/* 添加日文文字 */}
            <ResizableText
                text='この世界で名を残す方法はどう生きるかじゃない。どう死ぬかよ。'
                width={214}
                height={80}
                fontSize={18}
                initialPosition={{ x: 450, y: 220 }}
                showShadow={false}
            />

            {coverUrl && (
                <ResizableImage
                    src={coverUrl.startsWith('https') ? coverUrl : `/series/${coverUrl}`}
                    alt={seriesTitle || "封面图片"}
                    width={312}
                    height={468}
                    initialPosition={{ x: 80, y: 120 }}
                    className="shadow-poster"
                    borderRadius={20}
                />
            )}

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
                            <div className="md:hidden flex flex-col items-start mb-4 pl-[70px]">
                                <h2 className="mb-4 w-full font-bold text-2xl text-left">
                                    {card.seriesTitle || ""}
                                </h2>
                                {card.coverUrl && (
                                    <ResizableImage
                                        src={`/series/${card.coverUrl}`}
                                        alt={card.seriesTitle || "封面图片"}
                                        width={300}
                                        height={450}
                                        className="shadow-poster"
                                    />
                                )}
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
