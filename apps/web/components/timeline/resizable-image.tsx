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
    cookieId
}: ResizableImageProps) => {
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

    const positionCookieKey = cookieId ? `image_position_${cookieId}` : '';
    const sizeCookieKey = cookieId ? `image_size_${cookieId}` : '';

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).className.includes('resize-handle')) return;

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
            const aspectRatio = startSize.width / startSize.height;
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
                    newHeight = newWidth / aspectRatio;
                    break;
                case 'bottom-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    newX = position.x - (newWidth - startSize.width);
                    break;
                case 'top-right':
                    deltaWidth = e.clientX - startPos.x;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
                    newHeight = newWidth / aspectRatio;
                    newY = position.y - (newHeight - startSize.height);
                    break;
                case 'top-left':
                    deltaWidth = startPos.x - e.clientX;
                    newWidth = Math.max(40, startSize.width + deltaWidth);
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


    function handleMouseUp() {
        if (cookieId) {
            Cookies.set(positionCookieKey, JSON.stringify(position), { expires: 365 });
            Cookies.set(sizeCookieKey, JSON.stringify(size), { expires: 365 });
        }
    }

    // 添加和移除全局鼠标事件监听器
    useEffect(() => {
        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setIsInteracting(false);
            setResizeDirection(null);
        };

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
            className={`fixed ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                background: 'transparent',
                zIndex: 50,
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