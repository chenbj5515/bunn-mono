"use client"

import { motion } from "framer-motion"

interface AppIconProps {
    name: string
    icon: string
    isHovered: boolean
    onHover: () => void
    onLeave: () => void
    onClick?: () => void
    tooltip?: string
}

export function AppIcon({ name, icon, isHovered, onHover, onLeave, onClick, tooltip }: AppIconProps) {
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
                className="relative flex justify-center items-center bg-white shadow-md rounded-lg w-12 h-12"
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

            {isHovered && tooltip && (
                <motion.div
                    className="left-16 z-50 absolute min-w-[300px]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <div className="relative bg-white shadow-md px-6 py-3 rounded-[12px] w-[160px] text-[14px] text-black">
                        {tooltip}
                        <div className="top-1/2 left-[-6px] z-20 absolute bg-white w-5 h-5 rotate-45 -translate-y-1/2 transform"></div>
                    </div>
                </motion.div>
            )}

            {/* <motion.div
                className="left-16 z-50 absolute min-w-[300px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <div className="relative bg-white shadow-md px-6 py-3 rounded-[24px] w-[160px] text-[14px] text-black">
                    {tooltip}
                    <div className="top-1/2 left-[-6px] z-[-1] absolute bg-white w-5 h-5 rotate-45 -translate-y-1/2 transform"></div>
                </div>
            </motion.div> */}

            <motion.div
                className="bottom-0 absolute bg-black rounded-full w-1 h-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
            />
        </motion.div>
    )
}