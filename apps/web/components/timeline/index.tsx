"use client"

import { useState, useRef, useEffect } from "react"
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

// 定义 ResizableImage 组件的属性类型
interface ResizableImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    showShadow?: boolean; // 添加控制是否显示阴影的参数
}

// 可调整大小和位置的图片组件
const ResizableImage = ({ src, alt, width, height, className = '', showShadow = true }: ResizableImageProps) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: width || 300, height: height || 450 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState({ width: 0, height: 0 });
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).className.includes('resize-handle')) return;
        
        e.preventDefault(); // 防止默认的拖拽行为
        setIsDragging(true);
        setStartPos({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // 开始调整大小
    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        setStartPos({
            x: e.clientX,
            y: e.clientY
        });
        setStartSize({
            width: size.width,
            height: size.height
        });
    };

    // 处理鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        } else if (isResizing && resizeDirection) {
            const aspectRatio = startSize.width / startSize.height;
            let deltaWidth = 0;
            let deltaHeight = 0;
            let newWidth = startSize.width;
            let newHeight = startSize.height;
            let newX = position.x;
            let newY = position.y;

            // 根据不同调整方向计算新的尺寸和位置
            switch (resizeDirection) {
                case 'bottom-right':
                    deltaWidth = e.clientX - startPos.x;
                    newWidth = Math.max(100, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    break;
                case 'bottom-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(100, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    newX = position.x - (newWidth - startSize.width);
                    break;
                case 'top-right':
                    deltaWidth = e.clientX - startPos.x;
                    newWidth = Math.max(100, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    newY = position.y - (newHeight - startSize.height);
                    break;
                case 'top-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(100, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    newX = position.x - (newWidth - startSize.width);
                    newY = position.y - (newHeight - startSize.height);
                    break;
            }
            
            setSize({
                width: newWidth,
                height: newHeight
            });
            setPosition({
                x: newX,
                y: newY
            });
        }
    };

    // 结束拖动或调整大小
    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
    };

    // 添加和移除全局鼠标事件监听器
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeDirection]);

    return (
        <div 
            ref={imageRef}
            className={`relative rounded-[20px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                background: 'transparent'
            }}
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()} // 阻止默认的拖拽行为
        >
            <div className={`bg-transparent rounded-[20px] w-full h-full overflow-hidden ${showShadow ? 'shadow-md' : ''}`}>
                <Image 
                    src={src} 
                    alt={alt} 
                    fill
                    className="rounded-[20px] object-cover"
                    quality={90}
                    draggable="false" // 禁用图片的默认拖拽
                    style={{ borderRadius: '20px' }}
                />
            </div>
            {/* 右下角调整手柄 */}
            <div 
                className="right-0 bottom-0 absolute w-8 h-8 resize-handle cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />
            {/* 左下角调整手柄 */}
            <div 
                className="bottom-0 left-0 absolute w-8 h-8 resize-handle cursor-sw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            {/* 右上角调整手柄 */}
            <div 
                className="top-0 right-0 absolute w-8 h-8 resize-handle cursor-ne-resize"
                onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            {/* 左上角调整手柄 */}
            <div 
                className="top-0 left-0 absolute w-8 h-8 resize-handle cursor-nw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
        </div>
    );
};

export default function Timeline({ memoCards, alwaysShowTimestamp = false }: TimelineProps) {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null)
    
    // 获取第一个卡片的封面和标题用于固定展示
    const firstCard = memoCards.length > 0 ? memoCards[0] : null;
    const coverUrl = firstCard?.coverUrl || "";
    const seriesTitle = firstCard?.seriesTitle || "";

    return (
        <div className="relative min-h-screen font-mono">
            {/* 左侧固定封面图片和标题 */}
            <div className="hidden top-1/2 left-0 z-10 fixed md:flex flex-col items-start pt-6 pr-6 pb-6 pl-[70px] w-1/4 -translate-y-1/2">
                {/* <h2 className="mb-6 w-full font-bold text-2xl text-left">
                    {seriesTitle || ""}
                </h2> */}
                <ResizableImage 
                    src={"/titles/cyberpunk.png"} 
                    alt="cyberpunk" 
                    width={400} 
                    height={100}
                    className="mb-6"
                    showShadow={false}
                />
                {coverUrl && (
                    <ResizableImage 
                        src={coverUrl.startsWith('https') ? coverUrl : `/series/${coverUrl}`} 
                        alt={seriesTitle || "封面图片"} 
                        width={400}
                        height={600}
                        className="shadow-poster"
                    />
                )}
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
