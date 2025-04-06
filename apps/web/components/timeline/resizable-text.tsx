"use client"

import { useState, useRef, useEffect } from "react";
import Cookies from 'js-cookie';

// 定义 ResizableText 组件的属性类型
export interface ResizableTextProps {
    text: string;
    width?: number;
    height?: number;
    className?: string;
    fontSize?: number;
    showShadow?: boolean;
    initialPosition: { x: number, y: number };
    initialSize?: { width: number, height: number } | null; // 添加initialSize属性
    cookieId?: string; // 用于保存cookie的唯一标识
    id?: string; // 文字组件ID，用于上传图片
    onOpenUploadDialog?: (id: string, uploadType?: string) => void; // 打开上传对话框的回调函数
}

// 可调整大小和位置的文本组件
export const ResizableText = ({ 
    text, 
    width, 
    height, 
    className = '', 
    fontSize = 28,
    showShadow = true,
    initialPosition = { x: 0, y: 0 },
    initialSize, // 接收initialSize属性
    cookieId, // 用于保存cookie的唯一标识
    id = '', // 文字组件ID
    onOpenUploadDialog // 打开上传对话框的回调函数
}: ResizableTextProps) => {
    // 计算cookie键名
    const positionCookieKey = cookieId ? `title_position_${cookieId}` : '';
    const sizeCookieKey = cookieId ? `title_size_${cookieId}` : '';
    
    // 初始状态使用传入的默认值，避免服务端和客户端不一致
    const [position, setPosition] = useState(initialPosition);
    // 如果提供了initialSize，使用它，否则使用width和height
    const [size, setSize] = useState(
        initialSize || { width: width || 200, height: height || 80 }
    );

    console.log(position, size, "size=====");
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState({ width: 0, height: 0 });
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    
    // 保存位置和尺寸到cookie
    const saveToCookie = () => {
        console.log(cookieId, "cookieId=====");
        if (cookieId) {
            console.log(position, size, "cookie cookieId=====");
            Cookies.set(positionCookieKey, JSON.stringify(position), { expires: 365 });
            Cookies.set(sizeCookieKey, JSON.stringify(size), { expires: 365 });
        }
    };

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).className?.includes?.('resize-handle')) return;
        
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡
        setIsDragging(true);
        setIsInteracting(true);
        setStartPos({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // 开始调整大小
    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setIsInteracting(true);
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
                    deltaHeight = e.clientY - startPos.y;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = Math.max(40, startSize.height + deltaHeight);
                    break;
                case 'bottom-left':
                    deltaWidth = startPos.x - e.clientX;
                    deltaHeight = e.clientY - startPos.y;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = Math.max(40, startSize.height + deltaHeight);
                    newX = position.x - (newWidth - startSize.width);
                    break;
                case 'top-right':
                    deltaWidth = e.clientX - startPos.x;
                    deltaHeight = startPos.y - e.clientY;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = Math.max(40, startSize.height + deltaHeight);
                    newY = position.y - (newHeight - startSize.height);
                    break;
                case 'top-left':
                    deltaWidth = startPos.x - e.clientX;
                    deltaHeight = startPos.y - e.clientY;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = Math.max(40, startSize.height + deltaHeight);
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
        setIsInteracting(false);
        setResizeDirection(null);
        
        // 当用户完成拖动或调整大小后，保存到cookie
        saveToCookie();
    };

    // 添加和移除全局鼠标事件监听器
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // 添加移动和调整时禁用选择的样式
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // 恢复文本选择
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // 确保清理
            document.body.style.userSelect = '';
        };
    }, [isDragging, isResizing, resizeDirection]);

    return (
        <div 
            ref={textRef}
            className={`font-[cursive] font-[900] text-[rgb(135 135 135)] fixed ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className} fixed`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                background: 'transparent',
                zIndex: 50,
                userSelect: 'none',
                border: isInteracting ? '2px solid rgb(59, 130, 246)' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragStart={(e) => e.preventDefault()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 更换图标 - 位于文字容器上方 */}
            <div 
                className={`absolute left-1/2 -translate-x-1/2 -top-12 z-[60] transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            >
                <div 
                    className="bg-white hover:bg-gray-100 shadow-md p-2 rounded-full cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation(); // 防止事件冒泡
                        onOpenUploadDialog && onOpenUploadDialog(id, 'customTitleUrl');
                    }}
                    title="上传标题图片替换文字"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            </div>

            <div 
                className={`flex items-center justify-center w-full h-full ${showShadow ? 'shadow-md' : ''}`}
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.4',
                    textAlign: 'center',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
                    userSelect: 'none',
                    position: 'relative', // 添加相对定位以支持内部元素定位
                }}
            >
                {text}
            </div>
            {/* 右下角调整手柄 */}
            <div 
                className={`right-0 bottom-0 absolute resize-handle cursor-se-resize`}
                style={{
                    width: '10px',
                    height: '10px',
                    background: 'rgb(59, 130, 246)',
                    border: '1px solid white',
                    borderBottomRightRadius: '0px',
                    visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />
            {/* 左下角调整手柄 */}
            <div 
                className={`bottom-0 left-0 absolute resize-handle cursor-sw-resize`}
                style={{
                    width: '10px',
                    height: '10px',
                    background: 'rgb(59, 130, 246)',
                    border: '1px solid white',
                    borderBottomLeftRadius: '0px',
                    visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            {/* 右上角调整手柄 */}
            <div 
                className={`top-0 right-0 absolute resize-handle cursor-ne-resize`}
                style={{
                    width: '10px',
                    height: '10px',
                    background: 'rgb(59, 130, 246)',
                    border: '1px solid white',
                    borderTopRightRadius: '0px',
                    visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            {/* 左上角调整手柄 */}
            <div 
                className={`top-0 left-0 absolute resize-handle cursor-nw-resize`}
                style={{
                    width: '10px',
                    height: '10px',
                    background: 'rgb(59, 130, 246)',
                    border: '1px solid white',
                    borderTopLeftRadius: '0px',
                    visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
        </div>
    );
}; 