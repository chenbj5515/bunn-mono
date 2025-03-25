"use client"
import { WordCard } from "./index";
import { TWordCard } from "@/app/[locale]/word-cards/page";
import { createTranslator, useTranslations } from 'next-intl';

interface DemoWordCardProps {
    onUnRecognize?: (wordCardInfo: TWordCard) => void;
    defaultWordCardInfo: TWordCard;
}

export function DemoWordCard({ onUnRecognize, defaultWordCardInfo }: DemoWordCardProps) {
    const t = useTranslations();

    // 模拟回调函数
    const handleRecognize = (wordCardInfo: TWordCard) => {
    };

    const handleUnRecognize = (wordCardInfo: TWordCard) => {
        // 如果传入了外部的onUnRecognize回调，则调用它
        onUnRecognize?.(wordCardInfo);
    };

    return (
        <WordCard
            wordCardInfo={defaultWordCardInfo}
            onRecognize={handleRecognize}
            onUnRecognize={handleUnRecognize}
        />
    );
}