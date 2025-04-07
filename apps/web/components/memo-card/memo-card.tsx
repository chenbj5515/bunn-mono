"use client"
import React from "react";
import Image from "next/image";
import { getTimeAgo } from "@/utils";
import { speakText } from "@utils/tts"
import { Dictation } from "@/components/dictation";
import { Card } from "ui/components/card";
import { ExternalLink } from "lucide-react";
import { updateMemoCardTranslation, updatePronunciation, updateOriginalText } from "./server-functions";
import { insertWordCard } from "./server-functions/insert-word-card";
import { usePathname } from "next/navigation";
import { cardIdAtom } from "@/lib/atom";
import { useSetAtom } from "jotai";
import { memoCard } from "@db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useTranslations } from 'next-intl';
import { RecordingControls } from "./recording-controls";

export function MemoCard(props: InferSelectModel<typeof memoCard> & {
    onDelete?: (id: string) => void;
    weakBorder?: boolean;
    hideCreateTime?: boolean;
    width?: string | number;
    height?: string | number;
    rubyTranslations?: string;
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
        width,
        height,
        rubyTranslations,
    } = props;

    const t = useTranslations('memoCard');

    const [isFocused, setIsFocused] = React.useState(false);
    const [rubyTranslationMap, setRubyTranslationMap] = React.useState<Record<string, string>>({});

    const translationTextRef = React.useRef<HTMLDivElement>(null);
    const originalTextRef = React.useRef<HTMLDivElement>(null);
    const prevTranslationTextRef = React.useRef<string>("");
    const kanaTextRef = React.useRef<HTMLDivElement>(null);
    const prevKanaTextRef = React.useRef<string>("");
    const pathname = usePathname();

    const setCardId = useSetAtom(cardIdAtom);

    const cardRef = React.useRef<HTMLDivElement>(null);

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

    // 加载或更新Ruby元素的翻译
    React.useEffect(() => {
        // 如果已经有缓存的翻译数据，就解析并使用
        if (rubyTranslations) {
            try {
                const translations = JSON.parse(rubyTranslations);
                setRubyTranslationMap(translations);
            } catch (error) {
                console.error('解析Ruby翻译数据失败', error);
            }
        }
    }, [rubyTranslations]);

    function handlePlayBtn() {
        if (originalText) {
            speakText(originalText, {
                voiceName: "ja-JP-NanamiNeural",
            });
        }
    }

    function handleRubyClick(text: string) {
        speakText(text, {
            voiceName: "ja-JP-NanamiNeural",
        });
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

    function hanldeKanaFocus() {
        prevKanaTextRef.current = kanaTextRef.current?.textContent || "";
    }

    async function handleKanaBlur() {
        if (kanaTextRef.current?.textContent && kanaTextRef.current?.textContent !== prevKanaTextRef.current) {
            if (!pathname.includes('/home') && !pathname.includes('/guide')) {
                updatePronunciation(id, kanaTextRef.current?.textContent)
            }
        }
    }

    // 添加单词到单词本
    const handleAddToDictionary = async (word: string, meaning: string) => {
        try {
            const result = await insertWordCard(word, meaning, id);
            if (result instanceof Error) {
                throw result;
            }
            // 使用简单的alert替代toast
        } catch (error) {
            console.error('添加单词失败', error);
        }
    };

    // 增强Ruby元素，添加悬停显示翻译弹窗功能
    React.useEffect(() => {
        if (!originalTextRef.current) return;
        
        const rubyElements = originalTextRef.current.querySelectorAll('ruby');
        
        rubyElements.forEach(ruby => {
            ruby.style.cursor = 'pointer';
            
            // 移除所有现有事件监听器
            ruby.removeEventListener('click', handleRubyClick as any);
            
            // 添加点击事件监听器播放发音
            ruby.addEventListener('click', () => {
                const rtElement = ruby.querySelector('rt');
                const rubyText = rtElement?.textContent || '';
                handleRubyClick(rubyText);
            });
            
            // 获取原文本
            const textNode = ruby.childNodes[0];
            const originalWord = textNode ? textNode.textContent || '' : '';
            
            // 如果有翻译，添加悬停提示
            if (originalWord && rubyTranslationMap[originalWord]) {
                // 确保originalWord不为undefined（添加类型安全检查）
                const word = originalWord;
                const meaning = rubyTranslationMap[originalWord] || '';
                
                // 添加数据属性
                ruby.setAttribute('data-word', word);
                ruby.setAttribute('data-meaning', meaning);
                ruby.classList.add('ruby-word-tooltip');
                
                // 移除旧的悬停事件
                ruby.onmouseenter = null;
                ruby.onmouseleave = null;
                
                // 添加悬停事件
                ruby.onmouseenter = (e) => {
                    // 先移除所有现有弹窗，确保只有一个弹窗显示
                    const existingTooltips = document.querySelectorAll('.ruby-tooltip-popup');
                    existingTooltips.forEach(tip => tip.remove());
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'ruby-tooltip-popup';
                    tooltip.innerHTML = `
                        <div class="tooltip-content">
                            <div class="word-info">
                                <div class="word-title">語句: ${word}</div>
                                <div class="word-meaning">意味: ${meaning}</div>
                            </div>
                            <button class="add-to-dictionary-btn">单語帳に追加</button>
                        </div>
                    `;
                    
                    // 计算位置
                    const rubyRect = ruby.getBoundingClientRect();
                    tooltip.style.position = 'absolute';
                    tooltip.style.top = `${rubyRect.bottom + window.scrollY}px`;
                    tooltip.style.left = `${rubyRect.left + window.scrollX}px`;
                    
                    // 添加到DOM
                    document.body.appendChild(tooltip);
                    
                    // 添加按钮点击事件
                    const addButton = tooltip.querySelector('.add-to-dictionary-btn');
                    if (addButton) {
                        addButton.addEventListener('click', () => {
                            handleAddToDictionary(word, meaning);
                            tooltip.remove(); // 添加后关闭弹窗
                        });
                    }
                };
                
                // 移除mouseleave事件，让弹窗保持显示
                ruby.onmouseleave = null;
            }
        });
        
        // 监听document点击，关闭悬浮窗（点击空白区域或其他ruby元素时关闭）
        const handleDocumentClick = (e: MouseEvent) => {
            const tooltip = document.querySelector('.ruby-tooltip-popup');
            if (tooltip) {
                const target = e.target as Element;
                // 如果点击的不是弹窗内部元素，并且不是正在触发弹窗的ruby元素，则关闭弹窗
                if (!tooltip.contains(target) && !target.closest('.ruby-word-tooltip')) {
                    tooltip.remove();
                }
                
                // 如果点击的是另一个ruby元素，也关闭当前弹窗（新弹窗会在mouseenter事件中创建）
                const clickedRuby = target.closest('ruby');
                if (clickedRuby && !clickedRuby.contains(e.target as Node)) {
                    tooltip.remove();
                }
            }
        };
        
        document.addEventListener('click', handleDocumentClick);
        
        return () => {
            rubyElements.forEach(ruby => {
                ruby.removeEventListener('click', handleRubyClick as any);
                ruby.onmouseenter = null;
                ruby.onmouseleave = null;
            });
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [originalText, kanaPronunciation, rubyTranslationMap]);

    // 样式：定义Ruby元素的悬停提示样式
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // 添加CSS样式
        const styleId = 'ruby-tooltip-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                ruby.ruby-word-tooltip {
                    position: relative;
                    border-bottom: 1px dotted #888;
                    z-index: 999;
                }
                
                .ruby-tooltip-popup {
                    z-index: 1000;
                    background: white;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    padding: 12px;
                    min-width: 200px;
                    animation: fadeIn 0.15s ease-out;
                    border-top: 2px solid #f0f0f0;
                }
                
                .ruby-tooltip-popup .tooltip-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .ruby-tooltip-popup .word-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .ruby-tooltip-popup .word-title {
                    font-weight: 500;
                }
                
                .ruby-tooltip-popup .word-meaning {
                    color: #555;
                }
                
                .ruby-tooltip-popup .add-to-dictionary-btn {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 8px 12px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .ruby-tooltip-popup .add-to-dictionary-btn:hover {
                    background: #f5f5f5;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return () => {
            const element = document.getElementById(styleId);
            if (element) {
                element.remove();
            }
        };
    }, []);

    return (
        <Card
            ref={cardRef}
            className={`shadow-neumorphic w-[86%] m-auto text-[17px] relative p-5 border ${weakBorder ? 'border-gray-200' : ''} text-left leading-[1.9] tracking-[1.5px]`}
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
                                        src="data:image/png;base64,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"
                                        alt="read icon"
                                        width={16}
                                        height={16}
                                        className="w-4 overflow-hidden"
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
                        // contentEditable
                        className="relative outline-none w-[calc(100%-42px)]"
                        onBlur={handleOriginalTextBlur}
                        ref={originalTextRef}
                    >
                        {t('originalText')}：
                        {isFocused ? (
                            <section
                                className={`rounded-lg absolute ${isFocused ? "backdrop-blur-[3px] backdrop-saturate-[180%]" : ""
                                    }  w-[101%] h-[105%] -left-[4px] -top-[2px]`}
                            ></section>
                        ) : null}
                        <span
                            className="original-text"
                            dangerouslySetInnerHTML={{ __html: kanaPronunciation || "" }}
                        ></span>
                    </div>
                </div>

                <div>
                    {t('translation')}：
                    <span
                        suppressContentEditableWarning
                        contentEditable
                        ref={translationTextRef}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="pr-[42px] outline-none font-Default text-[18px] whitespace-pre-wrap"
                    >
                        {translation}
                    </span>
                </div>

                {/* <div>
                    {t('pronunciation')}：
                    <span
                        suppressContentEditableWarning
                        contentEditable
                        ref={kanaTextRef}
                        onFocus={hanldeKanaFocus}
                        onBlur={handleKanaBlur}
                        className="pr-[42px] outline-none whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: kanaPronunciation || "" }}
                    >
                        {kanaPronunciation}
                    </span>
                </div> */}

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
        </Card>
    );
}
