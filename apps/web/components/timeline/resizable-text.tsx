"use client"

import { useState, useRef, useEffect } from "react";

// 定义 ResizableText 组件的属性类型
export interface ResizableTextProps {
    text: string;
    width?: number;
    height?: number;
    className?: string;
    fontSize?: number;
    showShadow?: boolean;
    initialPosition?: { x: number, y: number };
}

// 可调整大小和位置的文本组件
export const ResizableText = ({ 
    text, 
    width, 
    height, 
    className = '', 
    fontSize: initialFontSize = 18,
    showShadow = true,
    initialPosition = { x: 0, y: 0 }
}: ResizableTextProps) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState({ width: width || 200, height: height || 80 });
    const [fontSize] = useState(initialFontSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState({ width: 0, height: 0 });
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).className.includes('resize-handle')) return;
        
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
    };

    // 添加和移除全局鼠标事件监听器
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // 添加移动和调整时禁用选择的样式
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            (document.body.style as any).MozUserSelect = 'none';
            (document.body.style as any).msUserSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // 恢复文本选择
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            (document.body.style as any).MozUserSelect = '';
            (document.body.style as any).msUserSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // 确保清理
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            (document.body.style as any).MozUserSelect = '';
            (document.body.style as any).msUserSelect = '';
        };
    }, [isDragging, isResizing, resizeDirection]);

    return (
        <div 
            ref={textRef}
            className={`text-[rgb(135 135 135)] fixed ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                background: 'transparent',
                zIndex: 50,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none' as any,
                msUserSelect: 'none' as any,
                border: isInteracting ? '2px dashed rgba(0, 150, 255, 0.7)' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()}
        >
            <div 
                className={`font-NewYork flex items-center justify-center w-full h-full ${showShadow ? 'shadow-md' : ''}`}
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.4',
                    textAlign: 'center',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none' as any,
                    msUserSelect: 'none' as any
                }}
            >
                {text}
            </div>
            {/* 右下角调整手柄 */}
            <div 
                className={`right-0 bottom-0 absolute resize-handle cursor-se-resize ${isInteracting ? 'bg-blue-500 bg-opacity-30 rounded-bl-lg' : ''}`}
                style={{
                    width: `${Math.max(16, size.width * 0.15)}px`,
                    height: `${Math.max(16, size.height * 0.15)}px`,
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />
            {/* 左下角调整手柄 */}
            <div 
                className={`bottom-0 left-0 absolute resize-handle cursor-sw-resize ${isInteracting ? 'bg-blue-500 bg-opacity-30 rounded-br-lg' : ''}`}
                style={{
                    width: `${Math.max(16, size.width * 0.15)}px`,
                    height: `${Math.max(16, size.height * 0.15)}px`,
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            {/* 右上角调整手柄 */}
            <div 
                className={`top-0 right-0 absolute resize-handle cursor-ne-resize ${isInteracting ? 'bg-blue-500 bg-opacity-30 rounded-bl-lg' : ''}`}
                style={{
                    width: `${Math.max(16, size.width * 0.15)}px`,
                    height: `${Math.max(16, size.height * 0.15)}px`,
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            {/* 左上角调整手柄 */}
            <div 
                className={`top-0 left-0 absolute resize-handle cursor-nw-resize ${isInteracting ? 'bg-blue-500 bg-opacity-30 rounded-br-lg' : ''}`}
                style={{
                    width: `${Math.max(16, size.width * 0.15)}px`,
                    height: `${Math.max(16, size.height * 0.15)}px`,
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
        </div>
    );
}; 