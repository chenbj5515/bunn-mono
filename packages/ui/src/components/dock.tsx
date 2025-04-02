"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppIcon } from "./app-icon"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export function Dock() {
    const [hoveredIcon, setHoveredIcon] = useState<number | null>(null)
    const [isDockVisible, setIsDockVisible] = useState(false)
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || "zh"

    const appIcons = [
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
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}