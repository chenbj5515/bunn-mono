"use client"
import React, { Suspense, use } from "react";
import { MemoCard } from "@/components/memo-card";
import { useTranslations } from 'next-intl';
import LoadingButton from 'ui/components/loading-button';
import { importSampleMemoCards } from "./server-functions"
import { useAudioPermission } from "@/hooks/audio";
import Loading from "ui/components/loading";
import { useAtomValue } from "jotai";
import { localCardAtom } from "@/lib/atom";
import { memoCard } from "@db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { Trash } from "lucide-react";
import { deleteMemoCard } from "../memo-card/server-functions";
import { ErrorBoundary } from "ui/components/error-boundary";

interface IProps {
    newCardsPromise: Promise<InferSelectModel<typeof memoCard>[]>
    forgottenCardsPromise: Promise<InferSelectModel<typeof memoCard>[]>
}

// 实际卡片列表内容组件
function MemoCardContent(props: IProps) {
    const { newCardsPromise, forgottenCardsPromise } = props;
    const [isLoading, setIsLoading] = React.useState(false);
    const localCards = useAtomValue(localCardAtom)
    const t = useTranslations('memoCards');

    // 直接使用use钩子，不包装在try/catch中
    const newCards = use(newCardsPromise) || [];
    const forgottenCards = use(forgottenCardsPromise) || [];

    const initialMemoCards = [...newCards, ...forgottenCards];

    const [displayCards, setDisplayCards] = React.useState(initialMemoCards);

    async function handleDelete(id: string) {
        setDisplayCards(prev => prev.filter(card => card.id !== id));
        
        try {
            await deleteMemoCard(id);
        } catch (error) {
            console.error('删除失败:', error);
            // setDisplayCards(initialMemoCards);
        }
    }

    async function handleImportSampleData() {
        try {
            setIsLoading(true);
            await importSampleMemoCards();
            window.location.reload();
        } catch (error) {
            console.error('导入示例数据失败:', error);
        }
    }

    return (
        <>
            {displayCards?.map(card => (
                <div className="group relative mx-auto mb-14 max-w-[800px] text-[18px] sm:text-base memo-card" key={card.id}>
                    <button 
                        className="top-0 right-[2%] z-10 absolute opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity duration-200"
                        onClick={() => handleDelete(card.id)}
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                    <MemoCard {...card} />
                </div>
            ))}
            {
                localCards.localCardList.length === 0 && displayCards.length === 0 ? (
                    <div className="flex justify-center items-center bg-gradient-to-b from-blue-50 dark:from-blue-900 to-white dark:to-blue-800 mt-[80px]">
                        <div className="mx-auto px-4 lg:px-8 sm:py-24 lg:py-32 text-center">
                            <h1 className="font-bold text-black sm:text-[2.2rem] dark:text-white text-3xl tracking-tight">
                                {t('noDataFound')}
                            </h1>
                            <div className="flex flex-col items-center gap-4 mt-6">
                                <LoadingButton
                                    onClick={handleImportSampleData}
                                    className="mt-2"
                                    isLoading={isLoading}
                                >
                                    {t('importSampleData')}
                                </LoadingButton>
                            </div>
                        </div>
                    </div>
                ) : null
            }
        </>
    );
}

// 主导出组件，包含错误边界
export function MemoCardList(props: IProps) {
    return (
        <ErrorBoundary
            onReset={() => {
                // 当用户点击重试按钮时执行的操作
                window.location.reload();
            }}
        >
            <Suspense fallback={<Loading />}>
                <MemoCardContent {...props} />
            </Suspense>
        </ErrorBoundary>
    );
}