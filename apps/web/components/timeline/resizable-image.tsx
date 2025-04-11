"use client"

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Cookies from 'js-cookie';

// 定义 ResizableImage 组件的属性类型
export interface ResizableImageProps {
    src: string;
    alt: string;
    className?: string;
    showShadow?: boolean;
    initialPosition: { x: number, y: number };
    initialSize: { width: number, height: number };
    borderRadius?: number;
    cookieId?: string;
    aspectRatio?: number | null;
    id?: string; // 图片组件ID，用于上传图片
    onOpenUploadDialog?: (id: string, uploadType?: string) => void; // 打开上传对话框的回调函数
    type?: string; // 图片类型
}

// 可调整大小和位置的图片组件
export const ResizableImage = ({
    src,
    alt,
    className = '',
    showShadow = true,
    initialPosition,
    initialSize,
    borderRadius = 0,
    cookieId,
    aspectRatio,
    id = '', // 图片组件ID
    onOpenUploadDialog, // 打开上传对话框的回调函数
    type // 图片类型
}: ResizableImageProps) => {
    console.log('cookieId=======', cookieId);
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState({ width: 0, height: 0 });
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const positionCookieKey = cookieId ? `${type === 'title' ? 'title' : 'cover'}_position_${cookieId}` : '';
    const sizeCookieKey = cookieId ? `${type === 'title' ? 'title' : 'cover'}_size_${cookieId}` : '';

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        // 检查是否点击了更换按钮或其父元素
        const target = e.target as HTMLElement;
        if (target.className?.includes?.('resize-handle')) return;
        
        // 检查点击元素或其父元素是否为更换按钮
        let currentElement: HTMLElement | null = target;
        while (currentElement) {
            if (currentElement.title === "更换图片") {
                return; // 如果是点击了更换按钮，则不处理拖动
            }
            currentElement = currentElement.parentElement;
        }

        e.preventDefault(); // 防止默认的拖拽行为
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
            // 使用提供的长宽比或计算当前长宽比
            const imageAspectRatio = aspectRatio !== undefined && aspectRatio !== null
                ? aspectRatio
                : startSize.width / startSize.height;
                
            let deltaWidth = 0;
            let newWidth = startSize.width;
            let newHeight = startSize.height;
            let newX = position.x;
            let newY = position.y;

            // 根据不同调整方向计算新的尺寸和位置
            switch (resizeDirection) {
                case 'bottom-right':
                    deltaWidth = e.clientX - startPos.x;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / imageAspectRatio;
                    break;
                case 'bottom-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / imageAspectRatio;
                    newX = position.x - (newWidth - startSize.width);
                    break;
                case 'top-right':
                    deltaWidth = e.clientX - startPos.x;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / imageAspectRatio;
                    newY = position.y - (newHeight - startSize.height);
                    break;
                case 'top-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / imageAspectRatio;
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
        if (isDragging || isResizing) {
            setIsDragging(false);
            setIsResizing(false);
            setIsInteracting(false);
            setResizeDirection(null);
            
            // 保存到cookie
            if (cookieId) {
                Cookies.set(positionCookieKey, JSON.stringify(position), { expires: 365 });
                Cookies.set(sizeCookieKey, JSON.stringify(size), { expires: 365 });
            }
        }
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
            ref={imageRef}
            className={`z-[1000] fixed ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${aspectRatio ? size.width / aspectRatio : size.height}px`,
                background: 'transparent',
                userSelect: 'none',
                border: isInteracting ? '2px solid rgb(59, 130, 246)' : 'none',
                borderRadius: `${borderRadius}px`,
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onDragStart={(e) => e.preventDefault()} // 阻止默认的拖拽行为
        >
            {/* 更换图标 - 位于图片容器上方 */}
            <div 
                className={`absolute left-1/2 -translate-x-1/2 -top-12 z-[60] transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            >
                <div 
                    className="bg-white hover:bg-gray-100 shadow-md p-2 rounded-full cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault(); // 防止默认行为
                        e.stopPropagation(); // 防止事件冒泡
                        // 确保这里能正确被调用
                        console.log('更换图片按钮被点击', id);
                        if (onOpenUploadDialog) {
                            onOpenUploadDialog(id, type === 'title' ? 'customTitleUrl' : 'customImageUrl');
                        }
                    }}
                    title="更换图片"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            </div>

            <div className={`bg-transparent w-full h-full overflow-hidden ${showShadow ? 'shadow-md' : ''}`}
                style={{
                    userSelect: 'none',
                    borderRadius: `${borderRadius}px`,
                }}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                    quality={90}
                    draggable="false" // 禁用图片的默认拖拽
                    style={{
                        borderRadius: `${borderRadius}px`,
                        userSelect: 'none',
                    }}
                />
            </div>
            {/* 右下角调整手柄 */}
            <div
                className={`right-0 bottom-0 absolute resize-handle cursor-se-resize`}
                style={{
                    width: '10px',
                    height: '10px',
                    background: 'rgb(59, 130, 246)',
                    border: '1px solid white',
                    borderBottomRightRadius: `${borderRadius > 0 ? borderRadius : 0}px`,
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
                    borderBottomLeftRadius: `${borderRadius > 0 ? borderRadius : 0}px`,
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
                    borderTopRightRadius: `${borderRadius > 0 ? borderRadius : 0}px`,
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
                    borderTopLeftRadius: `${borderRadius > 0 ? borderRadius : 0}px`,
                    visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
        </div>
    );
}; 