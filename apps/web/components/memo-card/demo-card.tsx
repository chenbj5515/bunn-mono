"use client"
import React from "react";
import { MemoCard } from "@/components/memo-card/memo-card";
import { useTranslations } from "next-intl";
import { useAudioPermission } from "@/hooks/audio";

type DemoCardProps = {
    type?: 'youtubeSubtitle' | 'netflixSubtitle' | 'contextText' | 'normalText';
    hideCreateTime?: boolean;
    width?: string | number;
    height?: string | number;
}

export function DemoCard({ type = 'youtubeSubtitle', hideCreateTime = false, width, height }: DemoCardProps) {
    const t = useTranslations('memoCards')
    useAudioPermission();

    const demoDataMap = {
        youtubeSubtitle: {
            id: "",
            translation: t('demoTranslation1'),
            createTime: new Date("2025-02-24T16:30:57.848Z").toISOString(),
            updateTime: new Date("2025-02-24T16:31:17.123Z").toISOString(),
            recordFilePath: "",
            originalText: "それ聞くの野暮だよお",
            reviewTimes: 0,
            userId: "",
            kanaPronunciation: "それきくのやぼだよお",
            contextUrl: "https://www.youtube.com/watch?v=9dS3EKcvofQ&t=146",
            forgetCount: 0
        },
        netflixSubtitle: {
            id: "",
            translation: t('demoTranslation3'),
            createTime: new Date("2025-02-24T16:30:57.848Z").toISOString(),
            updateTime: new Date("2025-02-24T16:31:17.123Z").toISOString(),
            recordFilePath: "",
            originalText: "福岡に美人が多いという噂は伝説でもなんでもなく、もはや定説と言ってもいいでしょう。",
            reviewTimes: 0,
            userId: "",
            kanaPronunciation: "ふくおかにびじんがおおいといううわさはでんせつでもなんでもなく、もはやていせつといってもいいでしょう。",
            contextUrl: "https://gokant-go.sawarise.co.jp/fukuoka-cute/?scrollY=1046&text=%25E7%25A6%258F%25E5%25B2%25A1%25E3%2581%25AB%25E7%25BE%258E%25E4%25BA%25BA%25E3%2581%258C%25E5%25A4%259A%25E3%2581%2584%25E3%2581%25A8%25E3%2581%2584%25E3%2581%2586%25E5%2599%2582%25E3%2581%25AF%25E4%25BC%259D%25E8%25AA%25AC%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2582%2593%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2581%258F%25E3%2580%2581%25E3%2582%2582%25E3%2581%25AF%25E3%2582%2584%25E5%25AE%259A%25E8%25AA%25AC%25E3%2581%25A8%25E8%25A8%2580%25E3%2581%25A3%25E3%2581%25A6%25E3%2582%2582%25E3%2581%2584%25E3%2581%2584%25E3%2581%25A7%25E3%2581%2597%25E3%2582%2587%25E3%2581%2586%25E3%2580%2582",
            forgetCount: 0
        },
        contextText: {
            id: "",
            translation: t('demoTranslation3'),
            createTime: new Date("2025-02-24T16:30:57.848Z").toISOString(),
            updateTime: new Date("2025-02-24T16:31:17.123Z").toISOString(),
            recordFilePath: "",
            originalText: "福岡に美人が多いという噂は伝説でもなんでもなく、もはや定説と言ってもいいでしょう。",
            reviewTimes: 0,
            userId: "",
            kanaPronunciation: "ふくおかにびじんがおおいといううわさはでんせつでもなんでもなく、もはやていせつといってもいいでしょう。",
            contextUrl: "https://gokant-go.sawarise.co.jp/fukuoka-cute/?scrollY=1046&text=%25E7%25A6%258F%25E5%25B2%25A1%25E3%2581%25AB%25E7%25BE%258E%25E4%25BA%25BA%25E3%2581%258C%25E5%25A4%259A%25E3%2581%2584%25E3%2581%25A8%25E3%2581%2584%25E3%2581%2586%25E5%2599%2582%25E3%2581%25AF%25E4%25BC%259D%25E8%25AA%25AC%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2582%2593%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2581%258F%25E3%2580%2581%25E3%2582%2582%25E3%2581%25AF%25E3%2582%2584%25E5%25AE%259A%25E8%25AA%25AC%25E3%2581%25A8%25E8%25A8%2580%25E3%2581%25A3%25E3%2581%25A6%25E3%2582%2582%25E3%2581%2584%25E3%2581%2584%25E3%2581%25A7%25E3%2581%2597%25E3%2582%2587%25E3%2581%2586%25E3%2580%2582",
            forgetCount: 0
        },
        normalText: {
            id: "",
            translation: t('demoTranslation4'),
            createTime: new Date("2025-02-24T16:30:57.848Z").toISOString(),
            updateTime: new Date("2025-02-24T16:31:17.123Z").toISOString(),
            recordFilePath: "",
            originalText: "CursorのProject Rules運用のベストプラクティスを探る",
            reviewTimes: 0,
            userId: "",
            kanaPronunciation: "カーソルのぷろじぇくと るーるすうんようのべすとぷらくてぃすをさぐる",
            contextUrl: "",
            forgetCount: 0
        }
    }

    return (
        <MemoCard
            {...demoDataMap[type]}
            onDelete={() => { }}
            weakBorder
            hideCreateTime={hideCreateTime}
            width={width}
            height={height}
        />
    );
}
