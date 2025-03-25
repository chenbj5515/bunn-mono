"use client"
import React, { useEffect, useRef } from "react";
import { insertPlainTextAtCursor } from "@/utils";
import { useForceUpdate } from "@/hooks";
// import { checkLimit } from "@/server-functions/check-limit";
import { LockIcon, HelpCircle } from "lucide-react";
import * as ReactDOM from 'react-dom/client';
import { useTranslations } from "next-intl";
import { localCardListAtom } from "@/lib/atom";
import { useSetAtom } from "jotai";

export function InputBox() {
    const editableRef = useRef<HTMLDivElement>(null);
    const forUpdate = useForceUpdate();
    const t = useTranslations('memoCards')
    const [isComposing, setIsComposing] = React.useState(false);
    const [isLimited, setIsLimited] = React.useState(false);
    const defaultText = t('inputPlaceholder');

    const setLocalCardList = useSetAtom(localCardListAtom);

    const limitText = (
        <>
            <LockIcon className="inline-block mr-1 w-4 h-4 align-text-bottom" />
            {t('limitMessage')}
            <span
                className="text-blue-600 underline cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "/pricing";
                }}
            >
                Bunn Premium
            </span>
            解锁。
        </>
    );
    const ready2Send = editableRef.current?.textContent && editableRef.current?.textContent !== defaultText && !isLimited;
    const urlRef = useRef<string>("");

    async function handleSendBtnClick(originalText: string) {
        if (!originalText || originalText === defaultText || isLimited) return;
        try {
            setLocalCardList((prev) => [...prev, {
                key: Date.now(),
                original_text: originalText.includes(":") ? originalText.split(":")[1].trim() : originalText.trim(),
                context_url: urlRef.current
            }])

            // 检查使用限制
            // const hasReachedLimit = await checkLimit("memo_card");
            // if (hasReachedLimit) {
            //     setIsLimited(true);
            //     if (editableRef.current) {
            //         editableRef.current.innerHTML = '';
            //         // 使用 ReactDOM 渲染复杂的 JSX
            //         const root = ReactDOM.createRoot(editableRef.current);
            //         root.render(limitText);
            //     }
            // } else if (editableRef.current) {
            //     editableRef.current.textContent = "";
            // }
            forUpdate();
        }
        catch (e) {
        }
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const plainText = event.clipboardData.getData("text/plain");
        let parsedData;
        try {
            parsedData = JSON.parse(plainText);
        } catch {
            parsedData = plainText;
        }

        if (typeof parsedData === 'object' && parsedData !== null) {
            urlRef.current = parsedData?.url || "";
            if ('text' in parsedData) {
                insertPlainTextAtCursor(parsedData.text?.trim());
            }
        } else {
            urlRef.current = "";
            insertPlainTextAtCursor(plainText?.trim());
        }
        forUpdate();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const content = editableRef.current?.textContent;
        if (!content) return;

        if (event.key === 'Enter') {
            if (isComposing || content === defaultText) {
                // 正在输入法合成，不触发发送
                return;
            }

            event.preventDefault();
            setLocalCardList((prev) => [...prev, {
                key: Date.now(),
                original_text: content,
                context_url: urlRef.current
            }])
            if (editableRef.current) {
                editableRef.current.textContent = '';
            }
            forUpdate();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setTimeout(() => {
            setIsComposing(false);
        });
    };

    function handleBlur() {
        if (isLimited) return;
        if (editableRef.current && !editableRef.current.textContent?.trim()) {
            editableRef.current.textContent = defaultText;
            editableRef.current.classList.add("text-[#999]");
            forUpdate();
        }
    }

    function handleFocus() {
        if (isLimited) return;
        if (
            editableRef.current &&
            editableRef.current.textContent === defaultText
        ) {
            editableRef.current.textContent = "";
            editableRef.current.classList.remove("text-[#999]");
            forUpdate();
        }
    }

    useEffect(() => {
        if (editableRef.current) {
            editableRef.current.classList.add("text-[#999]");
            editableRef.current.textContent = defaultText;
            // 初始检查限制
            // checkLimit("memo_card").then(hasReachedLimit => {
            //     if (hasReachedLimit) {
            //         setIsLimited(true);
            //         if (editableRef.current) {
            //             editableRef.current.innerHTML = '';
            //             // 使用 ReactDOM 渲染复杂的 JSX
            //             const root = ReactDOM.createRoot(editableRef.current);
            //             root.render(limitText);
            //         }
            //     }
            // });
            forUpdate();
        }
    }, []);

    return (
        <div className="relative w-full min-h-[52px]">
            <div
                className="-top-[28px] left-0 absolute flex items-center gap-1 opacity-0 hover:opacity-100 text-foreground text-gray-600 dark:text-gray-400 transition-opacity duration-200 cursor-pointer"
                onClick={() => window.location.href = "/guide?scroll=1148"}
            >
                <HelpCircle className="mr-[2px] w-4 h-4" />
                <span className="text-sm">{t('whereToGetSentence')}</span>
            </div>
            <div
                ref={editableRef}
                onPaste={handlePaste}
                onKeyUp={forUpdate}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className={`input-box dark:bg-bgDark dark:text-white dark:border-[1px] w-full p-3 pl-3 pr-12 rounded-lg border-2 border-lightgrey outline-none focus:border-[#808080] bg-[#fff] transhtmlForm`}
                contentEditable={!isLimited}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onFocus={handleFocus}
            />
            {!isLimited && (
                <div
                    className={`w-[32px] h-[32px] ${ready2Send ? "bg-[#000] hover:bg-dark" : ""
                        } rounded-[0.375rem] absolute top-[50%] -translate-y-1/2 right-4`}
                    onClick={() => handleSendBtnClick(editableRef.current?.textContent || "")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="top-[50%] left-[50%] absolute w-4 h-4 -translate-x-[42%] -translate-y-1/2 cursor-pointer"
                        strokeWidth="2"
                    >
                        <path
                            d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"
                            fill={ready2Send ? "white" : "grey"}
                        ></path>
                    </svg>
                </div>
            )}
        </div>
    );
}
