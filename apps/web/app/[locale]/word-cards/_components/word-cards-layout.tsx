"use client"
import { useRouter } from "next/navigation";
import React, { Suspense, use } from "react";
import { MemoCard } from "@/components/memo-card/memo-card";
import { WordCard } from "@/components/word-card";
import { updateReviewTimes } from "../_server-functions";
import { TWordCard } from "../page";
import Loading from "ui/components/loading";
import { updateForgetCount } from "@/components/word-card/server-functions";
import { WordCardsGuide } from "./word-cards-guide";
// import { insertActionLogs } from "@/components/exam/server-actions/insert-action-logs";
import type { InferSelectModel } from "drizzle-orm";
import type { memoCard } from "@db/schema";
import { WordCardAdder } from "@/components/word-adder";
import { ErrorBoundary } from "ui/components/error-boundary";

interface IProps {
    newCardsPromise: Promise<TWordCard[]>;
    reviewCardsPromise: Promise<TWordCard[]>;
    memoCardCount: number;
    firstMemoCard?: InferSelectModel<typeof memoCard> | null;
}

function calculateElementsPerRow(parentWidth: number, childWidth = 280, minGap = 20) {
    // 如果容器宽度小于一个卡片宽度，则返回1
    if (parentWidth < childWidth) {
        return 1;
    }

    // 计算考虑最小间距后，最多能放几个卡片
    // 公式: n个卡片需要的总宽度 = n * childWidth + (n-1) * minGap <= parentWidth
    // 解方程: n * childWidth + (n-1) * minGap <= parentWidth
    // n * childWidth + n * minGap - minGap <= parentWidth
    // n * (childWidth + minGap) <= parentWidth + minGap
    // n <= (parentWidth + minGap) / (childWidth + minGap)
    const maxCards = Math.floor((parentWidth + minGap) / (childWidth + minGap));

    return Math.max(1, maxCards); // 至少返回1
}

function splitIntoRows<T>(wordList: T[], n: number) {
    const rows = [];
    for (let i = 0; i < wordList.length; i += n) {
        rows.push(wordList.slice(i, i + n));
    }
    return rows;
}

function WordCardsContent(props: IProps) {
    const { newCardsPromise, reviewCardsPromise, memoCardCount, firstMemoCard } = props;
    const router = useRouter();

    const newCards = use(newCardsPromise);
    const reviewCards = use(reviewCardsPromise);
    const wordCards = [...newCards, ...reviewCards];

    const [rows, setRows] = React.useState<TWordCard[][]>([]);
    const [cardInfo, setCardInfo] = React.useState<InferSelectModel<typeof memoCard> | null>(null);
    const [showGlass, setShowGlass] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const cardWidthRef = React.useRef(280); // 卡片宽度
    const gapWidthRef = React.useRef(20);   // 最小间距
    const ref = React.useRef<HTMLDivElement>(null);

    const updateLayout = React.useCallback(() => {
        if (ref.current) {
            const containerWidth = ref.current.clientWidth;
            const cardWidth = cardWidthRef.current;
            const minGap = gapWidthRef.current;
            const elementNumPerRow = calculateElementsPerRow(containerWidth, cardWidth, minGap);

            setRows(prev => {
                const curRows = prev.flat().length ? prev.flat() : wordCards;
                const next = splitIntoRows<TWordCard>(curRows, elementNumPerRow);
                return next;
            });
        }
    }, [wordCards.length]);

    React.useEffect(() => {
        const observer = new ResizeObserver(updateLayout);
        
        // 初始化时执行一次布局计算
        updateLayout();
        
        observer.observe(document.documentElement);

        return () => {
            observer.disconnect();
        };
    }, [updateLayout]);

    React.useEffect(() => {
        document.addEventListener("mouseup", (event) => {
            const target = event.target;
            if (target instanceof Node) {
                const inContainer =
                    target === containerRef.current
                    || containerRef.current?.contains(target);
                if (inContainer === false) {
                    setShowGlass(false);
                }
            }
        });
    }, []);

    // 计算每行卡片之间的实际间距
    const calculateGap = (containerWidth: number, cardsInRow: number, cardWidth: number) => {
        if (cardsInRow <= 1) return 0;
        return (containerWidth - cardsInRow * cardWidth) / (cardsInRow - 1);
    };

    async function handleRecognizeClick(wordCardInfo: TWordCard) {
        if (rows.length === 1 && rows[0]?.length === 1) {
            router.refresh();
        }
        setRows(prev => {
            if (prev.length === 1) {
                const updatedRow = prev[0]?.filter(item => item.id !== wordCardInfo.id) || [];
                return [updatedRow];
            }
            const n = prev[0]?.length || 0;
            const flattened = prev.flat();
            const updated = flattened.filter(item => item.id !== wordCardInfo.id);
            const next: TWordCard[][] = [];
            for (let i = 0; i < updated.length; i += n) {
                next.push(updated.slice(i, i + n));
            }
            return next;
        });
        await updateReviewTimes(wordCardInfo);
        // TODO: 实现 insertActionLogs 功能
    }

    function handleUnRecognizeClick(item: TWordCard) {
        setShowGlass(true);
        setCardInfo(item.memo_card);
        updateForgetCount(item);
    }

    return (
        <>
            {showGlass && cardInfo ? (
                <div className="top-[0] left-[0] z-[10000] fixed backdrop-blur-[3px] backdrop-saturate-[180%] w-[100vw] h-[100vh] overflow-scroll">
                    <div ref={containerRef} className="top-[50%] left-[50%] absolute p-[22px] w-full sm:w-[auto] sm:min-w-[46vw] max-h-[92%] overflow-auto -translate-x-1/2 -translate-y-1/2 transform">
                        <MemoCard {...cardInfo} />
                    </div>
                </div>
            ) : null}
            <div ref={ref} className="w-full">
                {rows.length === 0 ? (
                    <>
                        <WordCardsGuide
                            memoCardCount={memoCardCount}
                            firstMemoCard={firstMemoCard}
                        />
                        <WordCardAdder />
                    </>

                ) : (
                    rows.map((row, rowIdx) => {
                        // 获取容器宽度
                        const containerWidth = ref.current?.clientWidth || 0;

                        // 使用第一行的卡片数量计算标准间距
                        // 这确保了所有行（包括最后一行）使用相同的间距
                        const maxCardsPerRow = rows[0]?.length || 0;
                        const standardGap = calculateGap(containerWidth, maxCardsPerRow, cardWidthRef.current);

                        // 判断是否是最后一行且卡片数量少于最大行
                        const isLastIncompleteRow = rowIdx === rows.length - 1 && row.length < maxCardsPerRow;

                        return (
                            <div
                                key={rowIdx}
                                className="flex"
                                style={{
                                    marginBottom: '20px',
                                    // 完整行使用space-between，最后一行不完整时使用flex-start
                                    justifyContent: isLastIncompleteRow ? 'flex-start' : 'space-between'
                                }}
                            >
                                {
                                    row.map((cardInfo, cardIdx) => (
                                        <div
                                            key={cardInfo.id}
                                            style={{
                                                width: `${cardWidthRef.current}px`,
                                                // 对于最后一行，每个卡片（除了最后一个）都添加固定的右边距
                                                // 对于其他行，space-between会自动处理间距
                                                marginRight: isLastIncompleteRow && cardIdx < row.length - 1
                                                    ? `${standardGap}px`
                                                    : undefined
                                            }}
                                        >
                                            <WordCard
                                                wordCardInfo={cardInfo}
                                                onRecognize={handleRecognizeClick}
                                                onUnRecognize={handleUnRecognizeClick}
                                            />
                                        </div>
                                    ))
                                }
                            </div>
                        );
                    })
                )}
            </div>
        </>
    )
}

export function WordCards(props: IProps) {
    return (
        <ErrorBoundary
            onReset={() => {
                // 当用户点击重试按钮时执行的操作
                window.location.reload();
            }}
        >
            <Suspense fallback={<Loading />}>
                <WordCardsContent {...props} />
            </Suspense>
        </ErrorBoundary>
    );
}