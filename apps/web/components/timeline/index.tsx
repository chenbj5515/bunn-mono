"use client"

import { useState, useEffect } from "react"
import { MemoCard } from "@/components/memo-card"
import { memoCard } from "@db/schema"
import type { InferSelectModel } from "drizzle-orm"
import { ResizableText } from "./resizable-text"
import { ResizableImage } from "./resizable-image"
import { UploadDialog } from '@/components/upload-dialog'
import { uploadCustomTitleBackground } from '@/components/upload-dialog/server-functions'
import { updateEpisodeMetadata } from "./server-functions/update-season"

// 添加一个自定义CSS类名，用于禁用文本选择
const noSelectClass = "select-none";
// 用于去除contentEditable元素的蓝色边框
const noOutlineClass = "focus:outline-none hover:bg-gray-100/50 px-1 rounded transition-colors";

// 定义 MemoCardWithMetadata 类型，包含从数据库获取的 MemoCard 和额外的元数据
export interface MemoCardWithMetadata extends InferSelectModel<typeof memoCard> {
    // 元数据字段
    season?: number | null
    episode?: number | null
    episodeTitle?: string | null
    // seriesMetadata表的ID
    metadataId: string | null
    // 这两个字段从这里移除，作为独立参数
    translatedText?: string | null
}

// 定义Character接口
export interface Character {
    id: string
    name: string
    avatarUrl: string
    seriesId: string
    // 根据实际需要添加更多属性
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
    characters: Character[]
}

export default function Timeline({
    memoCards,
    seriesId,
    elementsStyle,
    seriesTitle,
    coverUrl,
    titleUrl,
    coverAspectRatio,
    titleAspectRatio,
    characters
}: TimelineProps) {
    // 添加上传对话框状态
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadType, setUploadType] = useState<string>("customTitleUrl");

    console.log(memoCards, "memoCards=====");
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

    // 处理上传
    const handleUpload = async (file: File, type?: string) => {
        if (!seriesId) return;

        console.log(`上传图片到系列ID ${seriesId}, 类型: ${type || uploadType}:`, file);

        try {
            // 上传标题图片
            if ((type || uploadType) === 'customTitleUrl') {
                const result = await uploadCustomTitleBackground(seriesId, file);
                // 关闭对话框
                setUploadDialogOpen(false);

                // 刷新页面以显示新上传的图片
                window.location.reload();
                return;
            }
        } catch (error) {
            console.error("上传图片失败:", error);
        }

        // 关闭对话框
        setUploadDialogOpen(false);
    };

    // 打开上传对话框
    const openUploadDialog = (id: string, type?: string) => {
        if (!id) return;

        setUploadType(type || 'customTitleUrl');
        setUploadDialogOpen(true);
    };

    /**
     * 处理季度输入框失焦事件
     * @param id 元数据记录ID
     * @param value 用户输入的季度值
     * @returns Promise<{success: boolean, message?: string}>
     */
    async function handleSeasonBlur(id: string, value: string | number | null | undefined) {
        // 如果值为空，可以将season设为null
        if (value === null || value === undefined || value === "") {
            return;
        }

        // 转换为数字类型
        const seasonNumber = typeof value === "string" ? parseInt(value, 10) : value;

        // 验证是否为合法的smallint(-32768到32767之间的整数)
        if (
            isNaN(Number(seasonNumber)) ||
            !Number.isInteger(seasonNumber) ||
            seasonNumber < -32768 ||
            seasonNumber > 32767
        ) {
            return {
                success: false,
                message: "季度必须是-32768到32767之间的整数"
            };
        }

        console.log(seasonNumber, "seasonNumber=====");
        // 校验通过，调用更新函数
        return await updateEpisodeMetadata(id, { season: seasonNumber });
    }


    return (
        <div className={`relative min-h-[calc(100vh-64px)] font-mono ${noSelectClass}`}>
            {/* 使用客户端渲染标记控制可调整元素的显示 */}
            <>
                {/* 固定位置的标题、文字和海报 */}
                {
                    titleUrl ? (
                        <ResizableImage
                            src={titleUrl.startsWith('https') ? titleUrl : `/titles/${titleUrl}`}
                            alt="cyberpunk"
                            initialPosition={elementsStyle?.title?.position || { x: 80, y: 10 }}
                            initialSize={elementsStyle?.title?.size || { width: 350, height: 400 }}
                            showShadow={false}
                            cookieId={generateCookieId("timeline")}
                            aspectRatio={titleAspectRatio}
                            id={seriesId || ''}
                            onOpenUploadDialog={openUploadDialog}
                            type="title"
                        />
                    ) : (
                        <ResizableText
                            text={seriesTitle}
                            fontSize={28}
                            initialPosition={elementsStyle?.title?.position || { x: 80, y: 10 }}
                            initialSize={elementsStyle?.title?.size}
                            showShadow={false}
                            cookieId={generateCookieId("timeline")}
                            id={seriesId || ''}
                            onOpenUploadDialog={openUploadDialog}
                        />
                    )
                }
                {coverUrl && (
                    <ResizableImage
                        src={coverUrl.startsWith('https') ? coverUrl : `/series/${coverUrl}`}
                        alt={seriesTitle || "封面图片"}
                        initialPosition={elementsStyle?.cover?.position || { x: 80, y: 120 }}
                        initialSize={elementsStyle?.cover?.size || { width: 364, height: 546 }}
                        className="shadow-poster"
                        borderRadius={20}
                        cookieId={generateCookieId("timeline")}
                        aspectRatio={coverAspectRatio}
                    />
                )}
            </>

            {/* 右侧卡片内容区域 - 定位在右半部分居中 */}
            <div className="space-y-24 ml-auto px-4 py-10 md:pr-8 w-full md:w-1/2">
                {memoCards.map((card, index) => {

                    return (
                        <div key={index} className="relative">
                            {/* 卡片内容 */}
                            <>
                                {/* 剧集信息 */}
                                {card.season && card.episode && (
                                    <div className="mb-5 text-[18px] text-center tracking-[0.5px]">
                                        第<span
                                            contentEditable
                                            suppressContentEditableWarning
                                            className={noOutlineClass}
                                            onBlur={(e) => {
                                                const value = e.currentTarget.textContent;
                                                handleSeasonBlur(card.metadataId || "", value);
                                            }}
                                        >{card.season}</span>季第<span className="p-1">{card.episode}</span>集{card.episodeTitle ? `: ${card.episodeTitle}` : ''}
                                    </div>
                                )}
                                <MemoCard
                                    {...card}
                                    weakBorder={true}
                                    hideCreateTime={false}
                                    characters={characters}
                                />
                            </>
                        </div>
                    )
                })}
            </div>

            {/* 上传对话框 */}
            {seriesId && (
                <UploadDialog
                    isOpen={uploadDialogOpen}
                    onClose={() => setUploadDialogOpen(false)}
                    onUpload={handleUpload}
                    title={seriesTitle}
                    uploadType={uploadType}
                    isReplacing={false}
                />
            )}
        </div>
    )
}
