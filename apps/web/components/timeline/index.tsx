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
    // 这两个字段从这里移除，作为独立参数
    translatedText?: string | null
}

// 定义元素样式类型
interface ElementStyle {
    position?: { x: number; y: number } | null;
    size?: { width: number; height: number } | null;
}

// 定义元素样式集合类型
interface ElementsStyleProps {
    title?: ElementStyle;
    cover?: ElementStyle;
}

interface TimelineProps {
    memoCards: MemoCardWithMetadata[]
    alwaysShowTimestamp?: boolean // 控制时间戳是否永远显示
    seriesId?: string // 添加seriesId参数
    elementsStyle?: ElementsStyleProps // 添加元素样式属性
    seriesTitle: string // 添加剧集标题作为独立参数
    coverUrl: string // 添加封面URL作为独立参数
    titleUrl?: string // 添加自定义标题URL
    coverAspectRatio?: number | null // 封面图片的长宽比
    titleAspectRatio?: number | null // 标题图片的长宽比
}

export default function Timeline({
    memoCards,
    seriesId,
    elementsStyle,
    seriesTitle,
    coverUrl,
    titleUrl,
    coverAspectRatio,
    titleAspectRatio
}: TimelineProps) {
    // 不再从第一个卡片获取封面和标题，而是直接使用参数
    console.log(seriesTitle, "seriesTitle=====");
    console.log(coverUrl, "coverUrl=====");
    console.log(titleUrl, "titleUrl=====");
    console.log(coverAspectRatio, "coverAspectRatio=====");
    console.log(titleAspectRatio, "titleAspectRatio=====");

    // 添加页面级别的禁用文本选择功能
    useEffect(() => {
        // 添加全局样式来禁用文本选择
        document.body.style.userSelect = 'none';
        // 标记客户端渲染完成

        return () => {
            // 组件卸载时恢复文本选择
            document.body.style.userSelect = '';
        };
    }, []);

    // 用于生成cookieId的辅助函数，将seriesId添加到cookieId中
    const generateCookieId = (baseId: string) => {
        return seriesId ? `${baseId}_${seriesId}` : baseId;
    };

    return (
        <div className={`relative min-h-screen font-mono ${noSelectClass}`}>
            {/* 使用客户端渲染标记控制可调整元素的显示 */}
            <>
                {/* 固定位置的标题、文字和海报 */}
                {/* <ResizableImage
                    src={"/titles/flower name.png"}
                    alt="cyberpunk"
                    initialPosition={elementsStyle?.title?.position || { x: 80, y: 10 }}
                    initialSize={elementsStyle?.title?.size || { width: 400, height: 100 }}
                    showShadow={false}
                    cookieId={generateCookieId("timeline_title")}
                /> */}
                {
                    titleUrl ? (
                        <ResizableImage
                            src={titleUrl.startsWith('https') ? titleUrl : `/titles/${titleUrl}`}
                            alt="cyberpunk"
                            initialPosition={elementsStyle?.title?.position || { x: 80, y: 10 }}
                            initialSize={elementsStyle?.title?.size || { width: 350, height: 400 }}
                            showShadow={false}
                            cookieId={generateCookieId("timeline_title")}
                            aspectRatio={titleAspectRatio}
                        />
                    ) : (
                        <ResizableText
                            text={seriesTitle}
                            fontSize={18}
                            initialPosition={{ x: 450, y: 220 }}
                            initialSize={elementsStyle?.title?.size}
                            showShadow={false}
                            cookieId={generateCookieId("timeline_japanese_text")}
                        />
                    )
                }

                {/* <ResizableImage
                        src={"/assets/quotes.png"}
                        alt="cyberpunk"
                        width={40}
                        height={40}
                        initialPosition={{ x: 420, y: 180 }}
                        initialSize={elementsStyle?.quotes?.size}
                        showShadow={false}
                        cookieId={generateCookieId("timeline_quotes")}
                    /> */}

                {/* <ResizableImage
                        src={"/assets/say.png"}
                        alt="cyberpunk"
                        width={40}
                        height={80}
                        initialPosition={{ x: 420, y: 180 }}
                        initialSize={elementsStyle?.say?.size}
                        showShadow={false}
                        cookieId={generateCookieId("timeline_say")}
                    /> */}

                {coverUrl && (
                    <ResizableImage
                        src={coverUrl.startsWith('https') ? coverUrl : `/series/${coverUrl}`}
                        alt={seriesTitle || "封面图片"}
                        initialPosition={elementsStyle?.cover?.position || { x: 80, y: 120 }}
                        initialSize={elementsStyle?.cover?.size || { width: 364, height: 546 }}
                        className="shadow-poster"
                        borderRadius={20}
                        cookieId={generateCookieId("timeline_cover")}
                        aspectRatio={coverAspectRatio}
                    />
                )}
            </>

            {/* 中央时间轴部分 - 绝对定位在页面中央 */}
            <div className="top-0 bottom-0 left-1/2 z-20 fixed w-3 -translate-x-1/2">
                {/* 时间轴线 */}
                {/* <div className="bg-white shadow-neumorphic-weak w-full h-full" /> */}
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
                            {/* <div
                                className="top-1/2 z-30 absolute bg-white shadow-neumorphic-weak rounded-full w-6 h-6 transition-all -translate-y-1/2 duration-200 cursor-pointer"
                                style={{
                                    position: 'absolute',
                                    left: '-29px',
                                }}
                                onMouseEnter={() => setHoveredNode(index)}
                                onMouseLeave={() => setHoveredNode(null)}
                            /> */}

                            {/* 时间戳显示 - 悬停时显示 */}
                            {/* {(alwaysShowTimestamp || hoveredNode === index) && (
                                <div className="top-1/2 right-[calc(100%+46px)] left-auto z-100 z-40 absolute flex flex-col justify-between items-center bg-white shadow-[0_5px_15px_rgba(0,0,0,0.07)] px-4 py-3 rounded-md w-[130px] h-[84px] text-base transition-opacity -translate-y-1/2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{date}</span>
                                    </div>
                                    <span>{time}</span>
                                </div>
                            )} */}

                            {/* 移动端封面图片和标题 */}
                            {/* <div className="md:hidden flex flex-col items-start mb-4 pl-[70px]">
                                <h2 className="mb-4 w-full font-bold text-2xl text-left">
                                    {seriesTitle || ""}
                                </h2>
                                {isClientRendered && coverUrl && (
                                    <ResizableImage
                                        src={coverUrl.startsWith('https') ? coverUrl : `/series/${coverUrl}`}
                                        alt={seriesTitle || "封面图片"}
                                        width={300}
                                        height={450}
                                        className="shadow-poster"
                                        cookieId={generateCookieId(`timeline_mobile_cover_${index}`)}
                                    />
                                )}
                            </div> */}

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
                                    hideCreateTime={false}
                                // hideCreateTime={true}
                                />
                            </>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
