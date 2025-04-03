"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppIcon } from "./app-icon"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

// 调试模式：设置为 true 时 dock 将始终显示
// 注释此行或设置为 false 时 dock 将仅在鼠标靠近左侧时显示
// const DEBUG_MODE = false
const DEBUG_MODE = true

// 定义应用图标数据接口
interface AppIconData {
    name: string;
    icon: string;
    onClick: () => void;
    tooltip?: string;
}

export function Dock() {
    const [hoveredIcon, setHoveredIcon] = useState<number | null>(null)
    const [isDockVisible, setIsDockVisible] = useState(DEBUG_MODE)
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || "zh"

    const appIcons: AppIconData[] = [
        {
            name: "Card",
            icon: "/icon/card.png",
            onClick: () => router.push(`/${locale}/memo-cards`),
            tooltip: "连续两次按下v键把剪切板中的内容制作为卡片"
        },
        {
            name: "YouTube",
            icon: "/icon/youtube.png",
            onClick: () => router.push(`/${locale}/series-list/youtube`)
        },
        {
            name: "Netflix",
            icon: "/icon/netflix-n.png",
            onClick: () => router.push(`/${locale}/series-list/netflix`)
        },
        {
            name: "Twitter",
            icon: "/icon/x.png",
            onClick: () => window.open("https://twitter.com", "_blank")
        },
    ]

    useEffect(() => {
        // 如果是调试模式，不添加鼠标事件监听，dock 将始终显示
        if (DEBUG_MODE) return

        const handleMouseMove = (e: MouseEvent) => {
            // 当鼠标在距离左边界70px范围内时显示Dock
            if (e.clientX <= 70) {
                setIsDockVisible(true)
            } else {
                setIsDockVisible(false)
            }
        }

        // 添加鼠标移动事件监听
        document.addEventListener('mousemove', handleMouseMove)

        // 清理事件监听
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <div className="top-1/2 z-[100] fixed flex -translate-y-1/2 cursor-pointer">
            <motion.div
                className="flex flex-col justify-center items-center bg-[#0000000d] backdrop-blur-[12px] backdrop-saturate-[180%] px-2 pt-2 pb-4 border-[0.5px] border-white/20 rounded-2xl"
                initial={{ opacity: 0, x: -100 }}
                animate={{
                    opacity: isDockVisible ? 1 : 0,
                    x: isDockVisible ? 0 : -100
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="flex flex-col items-center gap-[14px] pt-4">
                    {appIcons.map((app, index) => (
                        <AppIcon
                            key={app.name}
                            name={app.name}
                            icon={app.icon}
                            isHovered={hoveredIcon === index}
                            onHover={() => setHoveredIcon(index)}
                            onLeave={() => setHoveredIcon(null)}
                            onClick={app.onClick}
                            tooltip={app.tooltip}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}