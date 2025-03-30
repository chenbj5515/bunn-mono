"use client"
import React from "react";
import Image from "next/image";
import { getTimeAgo } from "@/utils";
import { speakText } from "@utils/tts"
import { Dictation } from "@/components/dictation";
import { Card } from "ui/components/card";
import { ExternalLink } from "lucide-react";
import { deleteMemoCard, updateMemoCardTranslation, updatePronunciation, updateOriginalText } from "./server-functions";
import { Button } from "ui/components/button";
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
        height
    } = props;

    const t = useTranslations('memoCard');

    const [isFocused, setIsFocused] = React.useState(false);

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
                // width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
                height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
                minHeight: '420px'
            }}
        >
            {!hideCreateTime && (
                <div className={`-top-[30px] left-1 absolute ${weakBorder ? 'text-white' : 'text-[#999]'} text-[16px] sm:text-[14px]`}>
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
                            className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-2 right-2 absolute flex justify-center items-center dark:bg-bgDark dark:shadow-none border border-solid rounded-[50%] w-12 h-12 cursor-pointer`}
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
                                <div className="relative pb-[68px] w-12">
                                    <div
                                        className={`shadow-neumorphic hover:shadow-neumorphic-button-hover z-10 relative flex justify-center items-center bg-white dark:bg-bgDark dark:shadow-none border-solid rounded-full w-12 h-12 transition-all duration-300 cursor-pointer`}
                                        onClick={handlePlayBtn}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            height="20"
                                            width="24"
                                        >
                                            <path
                                                clipRule="evenodd"
                                                d="M11.26 3.691A1.2 1.2 0 0 1 12 4.8v14.4a1.199 1.199 0 0 1-2.048.848L5.503 15.6H2.4a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2h3.103l4.449-4.448a1.2 1.2 0 0 1 1.308-.26Zm6.328-.176a1.2 1.2 0 0 1 1.697 0A11.967 11.967 0 0 1 22.8 12a11.966 11.966 0 0 1-3.515 8.485 1.2 1.2 0 0 1-1.697-1.697A9.563 9.563 0 0 0 20.4 12a9.565 9.565 0 0 0-2.812-6.788 1.2 1.2 0 0 1 0-1.697Zm-3.394 3.393a1.2 1.2 0 0 1 1.698 0A7.178 7.178 0 0 1 18 12a7.18 7.18 0 0 1-2.108 5.092 1.2 1.2 0 1 1-1.698-1.698A4.782 4.782 0 0 0 15.6 12a4.78 4.78 0 0 0-1.406-3.394 1.2 1.2 0 0 1 0-1.698Z"
                                                fillRule="evenodd"
                                            ></path>
                                        </svg>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-0 left-0 absolute flex justify-center items-center bg-white hover:bg-gray-100 opacity-0 group-hover:opacity-100 rounded-full w-12 h-12 transition-all group-hover:translate-y-14 duration-300`}
                                        onClick={() => window.open(contextUrl, "_blank")}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </Button>
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        height="20"
                        width="24"
                        className="top-[50%] left-[50%] absolute -translate-x-1/2 -translate-y-1/2"
                    >
                        <path
                            clipRule="evenodd"
                            d="M11.26 3.691A1.2 1.2 0 0 1 12 4.8v14.4a1.199 1.199 0 0 1-2.048.848L5.503 15.6H2.4a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2h3.103l4.449-4.448a1.2 1.2 0 0 1 1.308-.26Zm6.328-.176a1.2 1.2 0 0 1 1.697 0A11.967 11.967 0 0 1 22.8 12a11.966 11.966 0 0 1-3.515 8.485 1.2 1.2 0 0 1-1.697-1.697A9.563 9.563 0 0 0 20.4 12a9.565 9.565 0 0 0-2.812-6.788 1.2 1.2 0 0 1 0-1.697Zm-3.394 3.393a1.2 1.2 0 0 1 1.698 0A7.178 7.178 0 0 1 18 12a7.18 7.18 0 0 1-2.108 5.092 1.2 1.2 0 1 1-1.698-1.698A4.782 4.782 0 0 0 15.6 12a4.78 4.78 0 0 0-1.406-3.394 1.2 1.2 0 0 1 0-1.698Z"
                            fillRule="evenodd"
                        ></path>
                    </svg>
                </div>
            )}
            <div className="flex flex-col justify-between h-full card-content" style={{ minHeight: '420px' }}>
                <div>
                    <div
                        suppressContentEditableWarning
                        contentEditable
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
                        <span className="original-text">{originalText}</span>
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
                        className="pr-[42px] outline-none font-Default whitespace-pre-wrap"
                    >
                        {translation}
                    </span>
                </div>

                <div>
                    {t('pronunciation')}：
                    <span
                        suppressContentEditableWarning
                        contentEditable
                        ref={kanaTextRef}
                        onFocus={hanldeKanaFocus}
                        onBlur={handleKanaBlur}
                        className="pr-[42px] outline-none whitespace-pre-wrap"
                    >
                        {kanaPronunciation}
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
