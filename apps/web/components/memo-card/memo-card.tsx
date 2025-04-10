"use client"
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getTimeAgo } from "@/utils";
import { speakText } from "@utils/tts"
import { Dictation } from "@/components/dictation";
import { Card } from "ui/components/card";
import { ExternalLink } from "lucide-react";
import { updateMemoCardTranslation, updatePronunciation, updateOriginalText } from "./server-functions";
import { usePathname } from "next/navigation";
import { cardIdAtom } from "@/lib/atom";
import { useSetAtom } from "jotai";
import { memoCard } from "@db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useTranslations } from 'next-intl';
import { RecordingControls } from "./recording-controls";
import { CharacterSelectionDialog } from "../character-selection";
import { Character } from "../timeline";
import { updateMemoCardCharacter } from "../timeline/server-functions/update-character";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/components/tooltip";
import { insertWordCard } from "./server-functions/insert-word-card";

type KanaPronunciationData = {
    tag: string;
    children?: (string | { tag: string; text: string; rt: string })[];
    text?: string;
    rt?: string;
};

export function MemoCard(props: InferSelectModel<typeof memoCard> & {
    onDelete?: (id: string) => void;
    weakBorder?: boolean;
    hideCreateTime?: boolean;
    width?: string | number;
    height?: string | number;
    character?: Character;
}) {
    const {
        translation,
        kanaPronunciation,
        originalText,
        createTime,
        id,
        contextUrl,
        weakBorder = false,
        hideCreateTime = false,
        character,
        height,
        rubyTranslations,
        seriesId,
    } = props;

    const t = useTranslations('memoCard');

    const [isFocused, setIsFocused] = React.useState(false);
    const [isHoveringLabel, setIsHoveringLabel] = React.useState(false);
    const [showCharacterDialog, setShowCharacterDialog] = React.useState(false);

    // 添加本地角色状态
    const [selectedCharacter, setSelectedCharacter] = useState<Character|null|undefined>(character);
    
    // 当前显示的tooltip相关状态
    const [activeTooltip, setActiveTooltip] = useState<{word: string; meaning: string; position: {top: number; left: number}} | null>(null);
    
    console.log(activeTooltip, "activeTooltip=====")
    // 跟踪按钮按下状态
    const [isAddButtonActive, setIsAddButtonActive] = useState(false);

    // 解析JSON格式的rubyTranslations
    const rubyOriginalTextRecord = kanaPronunciation ? JSON.parse(kanaPronunciation.replace(/^```json|```$/g, '')) : {};

    const rubyTranslationRecord = rubyTranslations ? JSON.parse(rubyTranslations) : {};

    const translationTextRef = useRef<HTMLDivElement>(null);
    const originalTextRef = useRef<HTMLDivElement>(null);
    const prevTranslationTextRef = useRef<string>("");
    const pathname = usePathname();

    const setCardId = useSetAtom(cardIdAtom);

    const cardRef = useRef<HTMLDivElement>(null);

    // 处理Ruby元素点击，播放发音
    const handleRubyClick = (text: string) => {
        speakText(text, {
            voiceName: "ja-JP-NanamiNeural",
        });
    };

    // 添加单词到单词本
    const handleAddToDictionary = async (word: string, meaning: string) => {
        try {
            if (!pathname.includes('/home') && !pathname.includes('/guide')) {
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

    // 显示单词tooltip
    const showTooltip = (word: string, meaning: string, event: React.MouseEvent) => {
        const element = event.currentTarget as HTMLElement;
        const rect = element.getBoundingClientRect();
        
        setActiveTooltip({
            word,
            meaning,
            position: {
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            }
        });
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
    }, [activeTooltip]);

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

    function handleBlurChange(type: string) {
        setIsFocused(type === "blur" ? false : true);
    }

    React.useEffect(() => {
        if (cardRef.current) {
            cardRef.current.addEventListener("mouseup", () => {
                setCardId(id)
            });
        }
    }, []);

    function handlePlayBtn() {
        if (originalText) {
            speakText(originalText, {
                voiceName: "ja-JP-NanamiNeural",
            });
        }
    }

    function handleFocus() {
        prevTranslationTextRef.current = translationTextRef.current?.textContent || "";
    }

    async function handleBlur() {
        if (translationTextRef.current?.textContent && translationTextRef.current?.textContent !== prevTranslationTextRef.current) {
            if (!pathname.includes('/home') && !pathname.includes('/guide')) {
                updateMemoCardTranslation(id, translationTextRef.current?.textContent)
            }
        }
    }

    function handleOriginalTextBlur() {
        if (originalTextRef.current?.textContent && !pathname.includes('/home') && !pathname.includes('/guide')) {
            updateOriginalText(id, originalTextRef.current?.textContent?.slice(3))
        }
    }

    function handleOpenCharacterDialog() {
        setShowCharacterDialog(true);
    }

    function handleCloseCharacterDialog() {
        setShowCharacterDialog(false);
    }

    const handleSelectCharacter = async (character: Character) => {
        try {
            if (id) {
                // 立即更新本地状态，提供即时反馈
                setSelectedCharacter(character);

                // 同时更新数据库
                const result = await updateMemoCardCharacter(id, character.id);
                if (result.success) {
                    console.log('角色关联更新成功');
                } else {
                    console.error('角色关联更新失败:', result.message);
                    // 更新失败，重置本地状态
                    setSelectedCharacter(null);
                }
            }
        } catch (error) {
            console.error('更新角色关联出错:', error);
            // 更新失败，重置本地状态
            setSelectedCharacter(null);
        }
        setShowCharacterDialog(false);
    }

    // 递归渲染KanaPronunciation的JSX
    const renderKanaPronunciation = (data: KanaPronunciationData | null) => {
        if (!data) return null;
        
        // console.log(data, "data=====")
        if (data.tag === 'ruby') {
            const hasTranslation = rubyTranslationRecord[data.text || ''];
            console.log(rubyTranslationRecord, hasTranslation, "hasTranslation=====")
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

    // 渲染原始文本标签或角色头像
    const renderOriginalTextLabel = () => {
        if (selectedCharacter) {
            return (
                <div
                    className={`inline-flex relative items-center cursor-pointer`}
                    onClick={handleOpenCharacterDialog}
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
                            onClick={handleOpenCharacterDialog}
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

    return (
        <Card
            ref={cardRef}
            className={`shadow-neumorphic w-[86%] m-auto text-[17px] relative p-5 pt-[42px] border ${weakBorder ? 'border-gray-200' : ''} text-left leading-[1.9] tracking-[1.5px]`}
            style={{
                height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
                minHeight: '420px'
            }}
        >
            {!hideCreateTime && (
                <div className={`-top-[30px] left-1 absolute text-[#999] text-[16px] sm:text-[14px]`}>
                    {createTime ? getTimeAgo(createTime.toString()) : ""}
                </div>
            )}
            {/* 朗読ボタン */}
            {contextUrl ? (
                <>
                    {contextUrl.includes("youtube") || contextUrl.includes("netflix") ? (
                        <a
                            href={contextUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-2 right-2 absolute flex justify-center items-center dark:bg-bgDark dark:shadow-none border border-solid rounded-[50%] w-[54px] h-[54px] cursor-pointer`}
                        >
                            {
                                contextUrl.includes("youtube") ? (
                                    <div className="relative flex justify-center items-center w-[27px] h-5 overflow-hidden">
                                        <Image
                                            src="https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg"
                                            alt="read icon"
                                            width={16}
                                            height={20}
                                            className="left-[25px] w-4 scale-[4.5]"
                                            style={{ position: 'relative' }}
                                        />
                                    </div>
                                ) : (
                                    <Image
                                        src="/icon/netflix-n.png"
                                        alt="read icon"
                                        width={24}
                                        height={24}
                                        className="w-6 overflow-hidden"
                                    />
                                )
                            }
                        </a>
                    ) : (
                        <>
                            <div className="group top-2 right-2 absolute">
                                <div className="relative pb-[68px] w-[54px]">
                                    <div
                                        className={`shadow-neumorphic hover:shadow-neumorphic-button-hover z-10 relative flex justify-center items-center bg-white dark:bg-bgDark dark:shadow-none border-solid rounded-full w-[54px] h-[54px] transition-all duration-300 cursor-pointer`}
                                        onClick={handlePlayBtn}
                                    >
                                        <Image
                                            src="/icon/play-audio.svg"
                                            alt="play audio"
                                            width={24}
                                            height={20}
                                            className="w-6 h-5"
                                        />
                                    </div>
                                    <div
                                        className={`mt-2 cursor-pointer shadow-neumorphic hover:shadow-neumorphic-button-hover top-0 left-0 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 rounded-full w-[54px] h-[54px] transition-all group-hover:translate-y-14 duration-300`}
                                        onClick={() => window.open(contextUrl, "_blank")}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div
                    className={`shadow-neumorphic top-2 right-2 absolute dark:bg-bgDark dark:shadow-none border ${weakBorder ? 'border-gray-200' : ''} border-solid rounded-[50%] w-12 h-12 cursor-pointer play-button-bg`}
                    onClick={handlePlayBtn}
                >
                    <Image
                        src="/icon/play-audio.svg"
                        alt="play audio"
                        width={24}
                        height={20}
                        className="top-[50%] left-[50%] absolute w-6 h-5 -translate-x-1/2 -translate-y-1/2"
                    />
                </div>
            )}
            <div className="flex flex-col justify-between h-full card-content" style={{ minHeight: '420px' }}>
                <div>
                    <div
                        suppressContentEditableWarning
                        className={`relative flex items-center outline-none w-[calc(100%-42px)] ${selectedCharacter ? "items-center" : "items-baseline"}`}
                        onBlur={handleOriginalTextBlur}
                        ref={originalTextRef}
                    >
                        {renderOriginalTextLabel()}：
                        {isFocused ? (
                            <section
                                className={`z-[1000] rounded-lg absolute ${isFocused ? "backdrop-blur-[3px] backdrop-saturate-[180%]" : ""
                                    }  w-[101%] h-[105%] -left-[4px] -top-[2px]`}
                            ></section>
                        ) : null}
                        <span className="original-text">
                            {renderKanaPronunciation(rubyOriginalTextRecord)}
                        </span>
                    </div>
                </div>

                <div>
                    <span className={`inline-block ${selectedCharacter ? "w-11" : "w-[37px]"}`}>{t('translation')}</span>：
                    <span
                        suppressContentEditableWarning
                        contentEditable
                        ref={translationTextRef}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className={`pr-[42px] ${selectedCharacter ? "pl-[6px]" : ""} outline-none font-Default text-[18px] whitespace-pre-wrap`}
                    >
                        {translation}
                    </span>
                </div>

                <RecordingControls weakBorder={weakBorder} />

                <div className="mb-0">
                    {
                        originalText ? (
                            <Dictation
                                originalText={originalText}
                                cardID={id}
                                onBlurChange={handleBlurChange}
                                weakBorder={weakBorder}
                            />
                        ) : null
                    }
                </div>
            </div>

            {/* 单词Tooltip */}
            {activeTooltip && (
                <div 
                    className="z-[1000] absolute bg-white shadow-md p-3 border-gray-100 border-t-2 rounded-lg min-w-[200px]" 
                    data-ruby-tooltip="true"
                    style={{
                        top: `${activeTooltip.position.top}px`,
                        left: `${activeTooltip.position.left}px`,
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <div>語句: {activeTooltip.word}</div>
                            <div>意味: {activeTooltip.meaning}</div>
                        </div>
                        <button 
                            className={`w-full bg-white border border-gray-200 rounded p-2 text-sm cursor-pointer transition-all duration-200 h-9 relative ${
                                isAddButtonActive ? 'shadow-inner' : 'shadow-[2px_2px_4px_#bebebe,_-4px_-4px_8px_#ffffff]'
                            }`}
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

            {/* 角色选择弹窗 */}
            {showCharacterDialog && seriesId && (
                <CharacterSelectionDialog
                    seriesId={seriesId}
                    onClose={handleCloseCharacterDialog}
                    onSelect={handleSelectCharacter}
                />
            )}
        </Card>
    );
}


