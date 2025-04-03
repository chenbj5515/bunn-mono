"use client"

import { motion, AnimatePresence } from "framer-motion"
import Loading from "ui/components/loading"
import { localCardAtom } from '@/lib/atom';
import { useAtom } from 'jotai';
import { useEffect, useState } from "react";

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
    const [localCard] = useAtom(localCardAtom);
    const [animationKey, setAnimationKey] = useState(0);

    // 监听localCard.state变化，当状态变为'added'时重置动画
    useEffect(() => {
        if (localCard.state === 'added') {
            setAnimationKey(prev => prev + 1);
        }
    }, [localCard.state]);

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
                {name !== "Card" ? (
                    <div className="rounded-lg w-10 h-10 overflow-hidden">
                        <img
                            src={icon}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {localCard.state === 'adding' && (
                            <motion.div 
                                key="loading" 
                                className="scale-50"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 0.5 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Loading />
                            </motion.div>
                        )}
                        
                        {localCard.state === 'added' && (
                            <motion.div 
                                key="added" 
                                className="relative"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <svg
                                    key={animationKey}
                                    className="overflow-visible"
                                    viewBox="0 0 64 64"
                                    height="24px"
                                    width="24px"
                                >
                                    <path
                                        d="M 14 32 L 28 46 L 50 18"
                                        pathLength="100"
                                        stroke="green"
                                        style={{
                                            fill: "none",
                                            strokeWidth: 6,
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            animation: "checkmark 0.5s ease forwards",
                                        }}
                                    ></path>
                                </svg>
                                <style jsx>{`
                                    @keyframes checkmark {
                                        0% {
                                            stroke-dasharray: 0 100;
                                            stroke-dashoffset: 0;
                                        }
                                        100% {
                                            stroke-dasharray: 100 100;
                                            stroke-dashoffset: 0;
                                        }
                                    }
                                `}</style>
                            </motion.div>
                        )}
                        
                        {(!localCard.state || localCard.state === 'idle') && (
                            <motion.div 
                                key="normal" 
                                className="rounded-lg w-10 h-10 overflow-hidden"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img
                                    src={icon}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
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
                        {/* <div className="top-1/2 left-[-6px] z-20 absolute bg-white w-5 h-5 rotate-45 -translate-y-1/2 transform"></div> */}
                    </div>
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