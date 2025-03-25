"use client"
import React from "react";
import { useTranslations } from 'next-intl';
import LoadingButton from 'ui/components/loading-button';
import { MemoCard } from "@/components/memo-card/memo-card";
import { importSampleMemoCards } from "@/components/memo-card-list/server-functions";
import { Card } from "ui/components/card";
import { Button } from "ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/components/popover";
import type { InferSelectModel } from "drizzle-orm";
import type { memoCard } from "@db/schema";

interface IProps {
    memoCardCount: number;
    firstMemoCard?: InferSelectModel<typeof memoCard> | null;
}

export function WordCardsGuide(props: IProps) {
    const { memoCardCount, firstMemoCard } = props;
    const [isLoading, setIsLoading] = React.useState(false);
    const t = useTranslations('wordCards');

    console.log(memoCardCount, "memoCardCount===");
    async function handleImportSampleData() {
        try {
            setIsLoading(true);
            await importSampleMemoCards();
            window.location.reload();
        } catch (error) {
            console.error('导入示例数据失败:', error);
            setIsLoading(false);
        }
    }

    if (memoCardCount === 0) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh]">
                <div className="w-full text-center">
                    <h2 className="mb-4 font-bold text-[2.2rem]">{t('noWordCards')}</h2>
                    <p className="mb-6 text-[17px] text-gray-600 dark:text-gray-400">{t('importSampleFirst')}</p>
                    <div className="flex justify-center">
                        <LoadingButton
                            onClick={handleImportSampleData}
                            isLoading={isLoading}
                        >
                            {t('importSampleData')}
                        </LoadingButton>
                    </div>
                </div>
            </div>
        );
    }

    if (firstMemoCard) {
        return (
            <div className="flex flex-col justify-center mx-auto w-full max-w-3xl min-h-[60vh]">
                <div className="mb-8 text-center">
                    <div className="inline-block bg-blue-50 dark:bg-blue-950 px-6 py-3 rounded-lg">
                        <p className="text-blue-600 dark:text-blue-400 text-lg">
                            ✨ {t('selectWordGuideDesc')}
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <MemoCard {...firstMemoCard} />
                </div>
            </div>
        );
    }

    return null;
} 