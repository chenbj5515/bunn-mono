"use client";
import { FC, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

// 定义Channel类型
export interface Channel {
    channelId: string;
    channelName: string;
    avatarUrl?: string | null;
}

interface ChannelsClientProps {
    channels: Channel[]; // 接收来自服务器组件的频道数据
    savedPositions: Record<string, { x: number, y: number }>;
}

const ChannelsClient: FC<ChannelsClientProps> = ({ channels, savedPositions }): ReactNode => {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Channels');
    
    // 拖拽状态
    const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>(savedPositions);
    const [dragging, setDragging] = useState<string | null>(null);
    const dragOffset = useRef<{ x: number, y: number } | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    
    // 保存位置到cookie
    const savePositionsToCookie = (newPositions: Record<string, { x: number, y: number }>) => {
        try {
            document.cookie = `channel_positions=${JSON.stringify(newPositions)}; path=/; max-age=31536000`; // 有效期一年
        } catch (error) {
            console.error("Failed to save positions to cookie:", error);
        }
    };
    
    // 处理点击事件 - 导航到频道页面
    const handleChannelClick = (channelId: string) => {
        if (!isDraggingRef.current) { // 只有没有拖动时才导航
            const locale = pathname.split('/')[1];
            router.push(`/${locale}/channels/${channelId}`);
        }
    };
    
    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent, channelId: string) => {
        e.preventDefault();
        
        // 获取当前位置
        const currentPosition = positions[channelId] || { x: 0, y: 0 };
        
        // 记录鼠标与元素当前位置的偏移
        dragOffset.current = {
            x: e.clientX - currentPosition.x,
            y: e.clientY - currentPosition.y
        };
        
        setDragging(channelId);
        isDraggingRef.current = false; // 重置拖动状态
    };
    
    // 移动处理
    useEffect(() => {
        if (!dragging) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragOffset.current) return;
            
            // 标记为正在拖动，防止释放时触发点击事件
            isDraggingRef.current = true;
            
            // 计算新位置 (鼠标位置减去偏移量)
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            
            // 更新位置
            setPositions(prev => ({
                ...prev,
                [dragging]: { x, y }
            }));
        };
        
        const handleMouseUp = () => {
            setDragging(null);
            
            // 保存当前位置到cookie
            savePositionsToCookie(positions);
            
            // 延迟重置拖动状态，确保点击事件处理正确
            setTimeout(() => {
                isDraggingRef.current = false;
            }, 10);
        };
        
        // 添加全局事件监听
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        // 清理函数
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, positions]);
    
    return (
        <div className="relative w-full h-screen overflow-hidden">
            {channels.length === 0 ? (
                <div className="absolute inset-0 flex justify-center items-center">
                    <p className="text-gray-500">{t('noChannelsFound')}</p>
                </div>
            ) : (
                <>
                    {channels.map((channel) => {
                        const position = positions[channel.channelId] || { x: 0, y: 0 };
                        
                        return (
                            <div
                                key={channel.channelId}
                                className={`absolute ${dragging === channel.channelId ? 'cursor-grabbing' : 'cursor-grab'}`}
                                style={{
                                    left: `${position.x}px`,
                                    top: `${position.y}px`,
                                    zIndex: dragging === channel.channelId ? 100 : 10,
                                    touchAction: 'none', // 防止触摸事件引起页面滚动
                                }}
                                onMouseDown={(e) => handleMouseDown(e, channel.channelId)}
                                onClick={() => handleChannelClick(channel.channelId)}
                            >
                                <motion.div 
                                    className="relative rounded-full w-[80px] h-[80px]"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Image
                                        src={channel.avatarUrl || "/placeholder-avatar.png"}
                                        alt={channel.channelName}
                                        fill
                                        className="rounded-full object-cover"
                                        draggable="false" 
                                    />
                                    <div className="right-0 -bottom-6 left-0 absolute text-xs text-center whitespace-nowrap">
                                        {channel.channelName}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default ChannelsClient; 