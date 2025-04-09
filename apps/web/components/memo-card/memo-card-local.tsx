"use client"
import React, { useRef } from "react";
import Image from "next/image";
import { speakText } from "@utils/tts";
import { Dictation } from "@/components/dictation";
// import { ILoaclCard, deleteCard } from "@/store/local-cards-slice";
import { useRefState } from "@/hooks";
import { Card } from "ui/components/card";
import { insertMemoCard, updateMemoCardTranslation, updatePronunciation, updateOriginalText } from "./server-functions";
import { useAudioRecorder } from "@/hooks/audio";
import { ExternalLink } from "lucide-react";
import { cardIdAtom, ILoaclCard, localCardAtom } from "@/lib/atom";
import { useSetAtom } from "jotai";
import { memoCard } from "@db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useAIStream } from "@/hooks/use-ai-stream";
import { RecordingControls } from "./recording-controls";

export default function MemoCardLocal(props: ILoaclCard) {
    const { original_text, context_url, contextContent } = props;
    const setLocalCard = useSetAtom(localCardAtom)
    const setCardId = useSetAtom(cardIdAtom)
    const [recorderPressed, setRecorderPressedState] = React.useState(false);
    const [recordPlayBtnPressed, setRecordPlayBtnPressed] = React.useState(false);
    const [isHovering, setIsHovering] = React.useState(false);

    const [isFocused, setIsFocused] = React.useState(false);
    const [rubyTranslationRecord, setrubyTranslationRecord] = React.useState<Record<string, string>>({});

    const translationTextRef = React.useRef<HTMLDivElement>(null);
    const originalTextRef = React.useRef<HTMLDivElement>(null);
    const prevTranslationTextRef = React.useRef<string>("");
    const kanaTextRef = React.useRef<HTMLDivElement>(null);
    const prevKanaTextRef = React.useRef<string>("");
    const translateDoneRef = React.useRef(false)
    const kanaDoneRef = React.useRef(false);

    const [cardInfoRef, setCardInfo] = useRefState<InferSelectModel<typeof memoCard> | null>(null);

    const { startRecording, stopRecording, playRecording } = useAudioRecorder();

    const ref = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener("mouseup", () => {
                if (cardInfoRef.current?.id) {
                    setCardId(cardInfoRef.current.id)
                }
            });
        }
    }, [setCardId]);

    // 处理Ruby翻译
    React.useEffect(() => {
        if (cardInfoRef.current?.rubyTranslations) {
            try {
                const translations = JSON.parse(cardInfoRef.current.rubyTranslations);
                setrubyTranslationRecord(translations);
            } catch (error) {
                console.error('解析Ruby翻译数据失败', error);
            }
        }
    }, [cardInfoRef.current?.rubyTranslations]);

    // 增强Ruby元素，添加悬停显示翻译功能
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
            if (originalWord && rubyTranslationRecord[originalWord]) {
                // 创建或更新Tooltip属性
                ruby.setAttribute('data-tooltip', rubyTranslationRecord[originalWord]);
                ruby.classList.add('has-tooltip');
                ruby.title = rubyTranslationRecord[originalWord];
            }
        });
        
        return () => {
            rubyElements.forEach(ruby => {
                ruby.removeEventListener('click', handleRubyClick as any);
            });
        };
    }, [originalTextRef.current, kanaTextRef.current?.textContent, rubyTranslationRecord]);

    // 样式：定义Ruby元素的悬停提示样式
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // 添加CSS样式
        const styleId = 'ruby-tooltip-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                ruby.has-tooltip {
                    position: relative;
                    border-bottom: 1px dotted #888;
                }
                
                ruby.has-tooltip:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 14px;
                    white-space: nowrap;
                    z-index: 10;
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

    console.log(original_text, "original_text===")
    useAIStream(
        original_text ? `${original_text}，给出这句话的中文翻译，注意一定要中文。` : '',
        {
            onChunk: handleTranslationUpdate,
            onFinish: handleTranslationDone,
        }
    );

    useAIStream(
        original_text ? `${original_text}，给出这句话的平假名读音，注意只需要平假名读音和对应位置的标点符号。` : '',
        {
            onChunk: handleKanaUpdate,
            onFinish: handleKanaDone,
        }
    );

    async function handleAllDone() {
        if (translationTextRef.current?.textContent && kanaTextRef.current?.textContent) {
            const record = await insertMemoCard(original_text, translationTextRef.current.textContent, kanaTextRef.current.textContent, context_url, contextContent);
            if (record) {
                setCardInfo(JSON.parse(record))
            }
            setLocalCard({
                state: 'added',
                localCardList: []
            })
            setTimeout(() => {
                setLocalCard({
                    state: 'idle',
                    localCardList: []
                })
            }, 2000)
        }
    }

    function handleBlurChange(type: string) {
        setIsFocused(type === "blur" ? false : true);
    }

    function handleTranslationUpdate(res: string) {
        if (translationTextRef.current && translationTextRef.current?.textContent !== null) {
            translationTextRef.current.textContent += res;
        }
    }

    function handleTranslationDone() {
        translateDoneRef.current = true;
        if (translateDoneRef.current && kanaDoneRef.current) {
            handleAllDone();
        }
    }

    function handleKanaUpdate(res: string) {
        if (kanaTextRef.current && kanaTextRef.current?.textContent !== null) {
            kanaTextRef.current.textContent += res;
        }
    }

    function handleKanaDone() {
        kanaDoneRef.current = true;
        if (translateDoneRef.current && kanaDoneRef.current) {
            handleAllDone();
        }
    }

    function handlePlayBtn() {
        if (original_text) {
            speakText(original_text, {
                voiceName: "ja-JP-NanamiNeural",
            });
        }
    }

    function handleRubyClick(text: string) {
        speakText(text, {
            voiceName: "ja-JP-NanamiNeural",
        });
    }

    function handleRecordBtnClick() {
        setRecorderPressedState((prev) => !prev);
        if (recorderPressed) {
            stopRecording();
        } else {
            startRecording()
        }
    }

    function handleRecordPlayBtnClick() {
        setRecordPlayBtnPressed((prev) => !prev);
        playRecording();
    }

    function handleFocus() {
        if (translationTextRef.current?.textContent) {
            prevTranslationTextRef.current = translationTextRef.current.textContent;
        }
    }

    function handleOriginalTextBlur() {
        if (originalTextRef.current?.textContent && cardInfoRef.current?.id) {
            updateOriginalText(cardInfoRef.current?.id, originalTextRef.current?.textContent.slice(3))
        }
    }

    async function handleBlur() {
        if (cardInfoRef.current?.id && translationTextRef.current?.textContent) {
            updateMemoCardTranslation(cardInfoRef.current?.id, translationTextRef.current.textContent)
        }
    }

    function hanldeKanaFocus() {
        prevKanaTextRef.current = kanaTextRef.current?.textContent || "";
    }

    async function handleKanaBlur() {
        if (cardInfoRef.current?.id && kanaTextRef.current?.textContent && kanaTextRef.current?.textContent !== prevKanaTextRef.current) {
            updatePronunciation(cardInfoRef.current?.id, kanaTextRef.current.textContent)
        }
    }

    return (
        <Card
            ref={ref}
            className={`shadow-neumorphic w-[86%] m-auto text-[17px] relative p-5 border text-left leading-[1.9] tracking-[1.5px]`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 朗読ボタン */}
            {context_url ? (
                <>
                    {context_url.includes("youtube") || context_url.includes("netflix") ? (
                        <a
                            href={context_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-2 right-2 absolute flex justify-center items-center dark:bg-bgDark dark:shadow-none border border-solid rounded-[50%] w-12 h-12 cursor-pointer`}
                        >
                            {
                                context_url.includes("youtube") ? (
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
                                <div className="relative pb-[68px] w-12">
                                    <div
                                        className={`shadow-neumorphic hover:shadow-neumorphic-button-hover z-10 relative flex justify-center items-center bg-white dark:bg-bgDark dark:shadow-none border-solid rounded-full w-12 h-12 transition-all duration-300 cursor-pointer`}
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
                                        className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-0 left-0 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 rounded-full w-12 h-12 transition-all group-hover:translate-y-14 duration-300`}
                                        onClick={() => window.open(context_url, "_blank")}
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
                    className={`shadow-neumorphic top-2 right-2 absolute dark:bg-bgDark dark:shadow-none border border-solid rounded-[50%] w-12 h-12 cursor-pointer play-button-bg`}
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
            <div className="flex mb-[28px]">
                <div
                    suppressContentEditableWarning
                    contentEditable
                    className="relative outline-none w-[calc(100%-42px)]"
                    onBlur={handleOriginalTextBlur}
                    ref={originalTextRef}
                >
                    原文：
                    {isFocused ? (
                        <section
                            className={`rounded-lg absolute ${isFocused ? "backdrop-blur-[3px] backdrop-saturate-[180%]" : ""
                                }  w-[101%] h-[105%] -left-[4px] -top-[2px]`}
                        ></section>
                    ) : null}
                    <span className="original-text">{original_text}</span>
                </div>
            </div>
            翻訳：
            <div
                suppressContentEditableWarning
                contentEditable
                ref={translationTextRef}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="pr-[42px] outline-none font-Default leading-[3] whitespace-pre-wrap"
            >
            </div>
            読み：
            <div
                suppressContentEditableWarning
                contentEditable
                ref={kanaTextRef}
                onFocus={hanldeKanaFocus}
                onBlur={handleKanaBlur}
                className="pr-[42px] outline-none leading-[3] whitespace-pre-wrap"
            >
            </div>
           
            <RecordingControls />

            <div className="relative flex flex-col mt-2">
                {
                    cardInfoRef.current?.id ? (
                        <Dictation
                            originalText={original_text}
                            cardID={cardInfoRef.current?.id}
                            onBlurChange={handleBlurChange}
                        />
                    ) : null
                }
            </div>
        </Card>
    );
}
