"use client"

import { motion } from "framer-motion"

interface AppIconProps {
    name: string
    icon: string
    isHovered: boolean
    onHover: () => void
    onLeave: () => void
    onClick?: () => void
}

export function AppIcon({ name, icon, isHovered, onHover, onLeave, onClick }: AppIconProps) {
    return (
        <motion.div
            className="relative flex justify-center items-center"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >

            <motion.div
                className="relative flex justify-center items-center bg-white/80 shadow-md rounded-lg w-12 h-12"
                animate={{
                    scale: isHovered ? 1.2 : 1,
                    y: isHovered ? -5 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                }}
            >
                <div className="rounded-lg w-10 h-10 overflow-hidden">
                    <img
                        src={icon}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </motion.div>

            {isHovered && (
                <motion.div
                    className="left-[-120px] absolute bg-black/80 shadow-lg px-3 py-1.5 rounded-md text-white text-sm whitespace-nowrap"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                >
                    {name}
                </motion.div>
            )}

            <motion.div
                className="bottom-0 absolute bg-black rounded-full w-1 h-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
            />
        </motion.div>
    )
}