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
import { ContextButton } from "./context-button";
import { OriginalText } from "./original-text";

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
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null | undefined>(character);

    // 解析JSON格式的rubyTranslations
    // const rubyOriginalTextRecord = {}

    console.log(kanaPronunciation, "kanaPronunciation===")
    const rubyOriginalTextRecord = kanaPronunciation ? JSON.parse(kanaPronunciation.replace(/^```json|```$/g, '')) : {};
    const rubyTranslationRecord = rubyTranslations ? JSON.parse(rubyTranslations) : {};

    const translationTextRef = useRef<HTMLDivElement>(null);
    const originalTextRef = useRef<HTMLDivElement>(null);
    const prevTranslationTextRef = useRef<string>("");
    const pathname = usePathname();

    const setCardId = useSetAtom(cardIdAtom);
    const cardRef = useRef<HTMLDivElement>(null);

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
            <ContextButton contextUrl={contextUrl} handlePlayBtn={handlePlayBtn} weakBorder={weakBorder} />
            <div className="flex flex-col justify-between h-full card-content" style={{ minHeight: '420px' }}>
                <OriginalText 
                    selectedCharacter={selectedCharacter}
                    isFocused={isFocused}
                    originalTextRef={originalTextRef}
                    rubyOriginalTextRecord={rubyOriginalTextRecord}
                    rubyTranslationRecord={rubyTranslationRecord}
                    id={id}
                    onOpenCharacterDialog={handleOpenCharacterDialog}
                />

                <div className="mt-[20px] mb-[20px]">
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