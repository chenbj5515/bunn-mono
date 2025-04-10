"use client"
import React, { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { updateOriginalText } from "./server-functions";
import { Character } from "../timeline";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/components/tooltip";
import { useTranslations } from 'next-intl';
import { speakText } from "@utils/tts";
import { insertWordCard } from "./server-functions/insert-word-card";

// 防抖函数
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>) => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

type KanaPronunciationData = {
    tag: string;
    children?: (string | { tag: string; text: string; rt: string })[];
    text?: string;
    rt?: string;
};

interface OriginalTextProps {
    selectedCharacter?: Character | null;
    isFocused?: boolean;
    originalTextRef?: React.MutableRefObject<HTMLDivElement | null>;
    rubyOriginalTextRecord?: any;
    rubyTranslationRecord?: any;
    id?: string;
    onOpenCharacterDialog?: () => void;
}

export function OriginalText({
    selectedCharacter,
    isFocused = false,
    originalTextRef,
    rubyOriginalTextRecord,
    rubyTranslationRecord = {},
    id,
    onOpenCharacterDialog
}: OriginalTextProps) {
    const t = useTranslations('memoCard');
    const pathname = usePathname();
    const localOriginalTextRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 使用传入的 ref 或本地创建的 ref
    const effectiveRef = originalTextRef || localOriginalTextRef;

    // Tooltip 相关状态
    const [activeTooltip, setActiveTooltip] = useState<{ word: string; meaning: string; position: { top: number; left: number } } | null>(null);
    const [isAddButtonActive, setIsAddButtonActive] = useState(false);

    function handleOriginalTextBlur() {
        if (effectiveRef.current?.textContent && !pathname.includes('/home') && !pathname.includes('/guide') && id) {
            updateOriginalText(id, effectiveRef.current?.textContent?.slice(3));
        }
    }

    // 处理Ruby元素点击，播放发音
    const handleRubyClick = (text: string) => {
        console.log(text, "text=====")
        speakText(text, {
            voiceName: "ja-JP-NanamiNeural",
        });
    };

    // 显示单词tooltip
    const showTooltip = (word: string, meaning: string, event: React.MouseEvent) => {
        const element = event.currentTarget as HTMLElement;
        const rect = element.getBoundingClientRect();

        // 获取容器元素的位置信息
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
            // 计算相对于容器的相对位置
            const relativeTop = rect.bottom - containerRect.top;
            const relativeLeft = rect.left - containerRect.left;

            // 设置 tooltip 位置
            setActiveTooltip({
                word,
                meaning,
                position: {
                    top: relativeTop,
                    left: relativeLeft
                }
            });
        }
    };

    // 添加单词到单词本
    const handleAddToDictionary = async (word: string, meaning: string) => {
        try {
            if (!pathname.includes('/home') && !pathname.includes('/guide') && id) {
                const result = await insertWordCard(word, meaning, id);
                if (result instanceof Error) {
                    throw result;
                }
                console.log('单词添加成功');
            }
        } catch (error) {
            console.error('添加单词失败', error);
        } finally {
            // 无论成功失败都关闭tooltip
            setActiveTooltip(null);
        }
    };

    // 监听键盘事件，按空格键快捷添加单词
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && activeTooltip) {
                e.preventDefault(); // 防止页面滚动
                setIsAddButtonActive(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' && activeTooltip) {
                e.preventDefault();
                setIsAddButtonActive(false);
                handleAddToDictionary(activeTooltip.word, activeTooltip.meaning);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeTooltip, id, pathname]);

    // 监听点击事件，点击其他区域关闭tooltip
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // 如果点击的不是tooltip或ruby元素，则关闭tooltip
            if (activeTooltip) {
                const tooltipElement = document.querySelector('[data-ruby-tooltip="true"]');
                if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
                    const rubyElements = document.querySelectorAll('ruby');
                    let clickedOnRuby = false;

                    rubyElements.forEach(ruby => {
                        if (ruby.contains(event.target as Node)) {
                            clickedOnRuby = true;
                        }
                    });

                    if (!clickedOnRuby) {
                        setActiveTooltip(null);
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeTooltip]);

    // 监听鼠标移动事件，当鼠标不在tooltip或Ruby元素上时关闭tooltip
    useEffect(() => {
        const checkMousePosition = (event: MouseEvent) => {
            if (activeTooltip) {
                const tooltipElement = document.querySelector('[data-ruby-tooltip="true"]');
                const targetElement = document.elementFromPoint(event.clientX, event.clientY);

                if (!targetElement) return;

                // 检查鼠标是否在tooltip内
                let isOverTooltip = tooltipElement?.contains(targetElement);

                // 检查鼠标是否在任何Ruby元素上
                let isOverRuby = false;
                const rubyElements = document.querySelectorAll('ruby');

                rubyElements.forEach(ruby => {
                    if (ruby.contains(targetElement)) {
                        isOverRuby = true;
                    }
                });

                // 如果鼠标既不在tooltip上也不在任何ruby元素上，则关闭tooltip
                if (!isOverTooltip && !isOverRuby) {
                    setActiveTooltip(null);
                }
            }
        };

        // 使用防抖函数包装事件处理程序，30ms 的延迟可以提高性能
        const debouncedCheckMousePosition = debounce(checkMousePosition, 30);

        document.addEventListener('mousemove', debouncedCheckMousePosition);
        return () => {
            document.removeEventListener('mousemove', debouncedCheckMousePosition);
        };
    }, [activeTooltip]);

    // 渲染原始文本标签或角色头像
    const renderOriginalTextLabel = () => {
        if (selectedCharacter) {
            return (
                <div
                    className={`inline-flex relative items-center cursor-pointer`}
                    onClick={onOpenCharacterDialog}
                >
                    <span className="flex flex-col">
                        <div className="relative">
                            <img
                                src={selectedCharacter.avatarUrl || '/placeholder-avatar.png'}
                                alt={selectedCharacter.name}
                                className="inline-block mr-1 rounded-full w-10 h-10 object-cover"
                                onError={(e) => {
                                    // 图片加载失败时使用占位图
                                    (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                                }}
                            />
                            <span className="-top-5 left-[45%] absolute text-gray-600 text-xs whitespace-nowrap -translate-x-1/2">
                                {selectedCharacter.name}
                            </span>
                        </div>
                    </span>
                </div>
            );
        } else {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="inline-flex relative items-center cursor-pointer"
                            onClick={onOpenCharacterDialog}
                        >
                            <span className="inline-block whitespace-nowrap">{t('originalText')}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>{t('useCharacterAvatar')}</span>
                    </TooltipContent>
                </Tooltip>
            );
        }
    };

    // 递归渲染KanaPronunciation的JSX
    const renderKanaPronunciation = (data: KanaPronunciationData | null) => {
        if (!data) return null;

        if (data.tag === 'ruby') {
            const hasTranslation = rubyTranslationRecord[data.text || ''];
            return (
                <ruby
                    key={Math.random()}
                    onClick={() => handleRubyClick(data.rt || data.text || '')}
                    onMouseEnter={hasTranslation ?
                        (e) => showTooltip(data.text || '', rubyTranslationRecord[data.text || ''], e) :
                        undefined
                    }
                    className={`relative border-b border-dotted border-gray-500 z-[999] cursor-pointer ${hasTranslation ? 'has-translation' : ''}`}
                >
                    {data.text}
                    <rt>{data.rt}</rt>
                </ruby>
            );
        }

        if (data.tag === 'span' && data.children) {
            return (
                <span>
                    {renderOriginalTextLabel()}：
                    {data.children.map((child, index) => {
                        if (typeof child === 'string') {
                            return <React.Fragment key={index}>{child}</React.Fragment>;
                        } else {
                            return renderKanaPronunciation(child);
                        }
                    })}
                </span>
            );
        }

        return null;
    };

    return (
        <div ref={containerRef} className="relative w-[calc(100%-42px)]">
            <div
                suppressContentEditableWarning
                // contentEditable
                className={`relative flex items-center outline-none ${selectedCharacter ? "items-center" : "items-baseline"}`}
                onBlur={handleOriginalTextBlur}
                ref={effectiveRef}
            >
                {isFocused ? (
                    <section
                        className={`z-[1000] rounded-lg absolute ${isFocused ? "backdrop-blur-[3px] backdrop-saturate-[180%]" : ""
                            }  w-[101%] h-[105%] -left-[4px] -top-[2px]`}
                    ></section>
                ) : null}
                {renderKanaPronunciation(rubyOriginalTextRecord)}
            </div>

            {/* 单词Tooltip */}
            {activeTooltip && (
                <div
                    className="z-[1000] absolute bg-white shadow-md p-3 border-gray-100 border-t-2 rounded-lg min-w-[200px]"
                    data-ruby-tooltip="true"
                    style={{
                        top: `${activeTooltip.position.top}px`,
                        left: `${activeTooltip.position.left}px`,
                        maxWidth: '90%',
                        transformOrigin: 'top left',
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <div>語句: {activeTooltip.word}</div>
                            <div>意味: {activeTooltip.meaning}</div>
                        </div>
                        <button
                            className={`hover:shadow-neumorphic-button-hover w-full bg-white border border-gray-200 rounded p-2 text-sm cursor-pointer transition-all duration-200 h-9 relative ${isAddButtonActive ? 'shadow-neumorphic-button-hover' : 'shadow-neumorphic'}`}
                            onClick={() => handleAddToDictionary(activeTooltip.word, activeTooltip.meaning)}
                        >
                            <div className="relative flex justify-center items-center w-full h-full">
                                <span className="top-1/4 left-[16%] absolute text-gray-600 text-xl -translate-y-1/2">⎵</span>
                                <span className="top-1/2 right-[13%] absolute -translate-y-1/2">单語帳に追加</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}