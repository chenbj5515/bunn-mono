"use client"
import React from "react";
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
import { useEnhanceRuby } from "./hooks/use-enhance-ruby";

export function MemoCard(props: InferSelectModel<typeof memoCard> & {
    onDelete?: (id: string) => void;
    weakBorder?: boolean;
    hideCreateTime?: boolean;
    width?: string | number;
    height?: string | number;
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
    const rubyTranslationMap = JSON.parse(rubyTranslations || '{}');

    const translationTextRef = React.useRef<HTMLDivElement>(null);
    const originalTextRef = React.useRef<HTMLDivElement>(null);
    const prevTranslationTextRef = React.useRef<string>("");
    const kanaTextRef = React.useRef<HTMLDivElement>(null);
    const prevKanaTextRef = React.useRef<string>("");
    const pathname = usePathname();

    const setCardId = useSetAtom(cardIdAtom);

    const cardRef = React.useRef<HTMLDivElement>(null);

    useEnhanceRuby({
        originalTextRef,
        rubyTranslationMap,
        id
    });

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
                        // contentEditable
                        className="relative outline-none w-[calc(100%-42px)]"
                        onBlur={handleOriginalTextBlur}
                        ref={originalTextRef}
                    >
                        {t('originalText')}：
                        {isFocused ? (
                            <section
                                className={`z-[1000] rounded-lg absolute ${isFocused ? "backdrop-blur-[3px] backdrop-saturate-[180%]" : ""
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
                        className="pr-[42px] pl-[6px] outline-none font-Default text-[18px] whitespace-pre-wrap"
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
        </Card>
    );
}
