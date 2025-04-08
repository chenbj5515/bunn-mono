'use client'

import React, { useEffect, useRef, useState } from 'react'
import DailyReport from './index'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MemoCard } from '../memo-card/memo-card'
import { motion } from 'framer-motion'
import { SkeuomorphicCard } from './skeuomorphic-card'
import { Link } from 'lucide-react'
import { History } from 'lucide-react'
import { Button } from 'ui/components/button'
import { CompletionMessage } from './completion-message'
import { ScribbleReveal } from './scribble-reveal'
import { AudioPlayer } from './audio-player'
import { AnimatedCheckbox } from './animated-checkbox'
import { memoCard } from '@db/schema'
import type { InferSelectModel } from "drizzle-orm"
import { useTranslations } from 'next-intl'

export default function DemoDailyReport() {
    const t = useTranslations('dailyReport')
    
    const originalMemoCards = [
        {
            originalText: "まだしらばっくれるか！",
            kanaPronunciation: "まだしらばっくれるか！",
            contextUrl: "https://www.youtube.com/watch?v=QrwxVi9hWJg&t=14"
        },
        {
            originalText: "先日、ご依頼いただいた件ですが、私どもではお引き受けしかねます。",
            kanaPronunciation: "せんじつ、ごいらいいただいたけんですが、わたくしどもではおひきうけしかねます。",
            contextUrl: null
        },
        {
            originalText: "ここまできたら俺も引き下がれない",
            kanaPronunciation: "ここまできたらおれもひきさがれない",
            contextUrl: "https://www.youtube.com/watch?v=QrwxVi9hWJg&t=426"
        }
    ]

    const studyItems = [0, 1, 2].map(i => ({
        id: i,
        type: "meaning",
        question: t(`studyItems.item${i}.question`),
        answer: t(`studyItems.item${i}.answer`).split('，')[0] || "",
        memo_card: {
            id: "",
            translation: t(`studyItems.item${i}.translation`),
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            recordFilePath: "",
            originalText: originalMemoCards[i]!.originalText,
            reviewTimes: 0,
            userId: "",
            kanaPronunciation: originalMemoCards[i]!.kanaPronunciation,
            contextUrl: originalMemoCards[i]!.contextUrl,
            forgetCount: 0
        }
    }))

    const mockData = {
        "date": "Feb 27, 2025",
        "stats": {
            "flashcards": 0,
            "words": 2,
            "score": 0
        },
        studyItems
    }

    const [activeItems, setActiveItems] = useState(mockData.studyItems)
    const [showMemoCard, setShowMemoCard] = useState(false)
    const [currentMemoCard, setCurrentMemoCard] = useState<InferSelectModel<typeof memoCard> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const handleComplete = (id: number) => {
        setActiveItems(prev => prev.filter(item => item.id !== id))
    }

    const handleShowMemoCard = (card: InferSelectModel<typeof memoCard>) => {
        if (card) {
            setCurrentMemoCard(card)
            setShowMemoCard(true)
        }
    }

    // 添加点击外部关闭弹窗的效果
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Node) {
                if (containerRef.current && !containerRef.current.contains(target as Node)) {
                    setShowMemoCard(false);
                }
            }
        };

        document.addEventListener("mouseup", handleClickOutside);
        return () => {
            document.removeEventListener("mouseup", handleClickOutside);
        };
    }, []);

    const isAllCompleted = activeItems.length === 0;
    const noStudyRecord = mockData.stats.flashcards === 0 && mockData.stats.words === 0 && mockData.stats.score === 0;

    return (
        <div className="mx-auto pt-[42px] pr-[32px] pl-[32px] container">
            <div className="pb-[14px] font-mono">
                {showMemoCard && currentMemoCard ? (
                    <div className="top-[0] left-[0] z-[10000] fixed backdrop-blur-[3px] backdrop-saturate-[180%] w-[100%] h-[100vh] overflow-scroll">
                        <div ref={containerRef} className="top-[50%] left-[50%] absolute p-[22px] w-full sm:w-[auto] sm:min-w-[46vw] max-h-[92%] overflow-auto -translate-x-1/2 -translate-y-1/2 transform">
                            <MemoCard {...currentMemoCard} />
                        </div>
                    </div>
                ) : null}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-4xl"
                >
                    <header className="relative flex justify-between items-center mb-12 text-center">
                        <div className="left-1/2 absolute -translate-x-1/2">
                            <p className="font-bold text-gray-600 text-xl tracking-[2px]">{mockData.date}</p>
                        </div>
                    </header>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <SkeuomorphicCard className='border-[#1d283a] boder'>
                            <div className="gap-2 grid grid-cols-1">
                                <div className="px-6 text-center">
                                    <h2 className="font-bold text-gray-800 text-lg">{t('completedLearning')}</h2>
                                </div>
                                <div className="grid grid-cols-3 divide-x">
                                    <div className="px-6 py-4 text-center">
                                        <h3 className="mb-1 font-bold text-gray-600 text">{t('sentences')}</h3>
                                        <p className="text-gray-900 text-2xl">{mockData.stats.flashcards}</p>
                                    </div>
                                    <div className="px-6 py-4 text-center">
                                        <h3 className="mb-1 font-bold text-gray-600 text">{t('words')}</h3>
                                        <p className="text-gray-900 text-2xl">{mockData.stats.words}</p>
                                    </div>
                                    <div className="px-6 py-4 text-center">
                                        <h3 className="mb-1 font-bold text-gray-600 text">{t('test')}</h3>
                                        <p className="text-gray-900 text-2xl">{mockData.stats.score}</p>
                                    </div>
                                </div>
                            </div>
                        </SkeuomorphicCard>
                    </motion.div>

                    <motion.div className={`${!noStudyRecord && !isAllCompleted ? '' : 'mt-[14px]'}`}>
                        <AnimatePresence mode="sync">
                            {noStudyRecord ? (
                                <div className="py-12 text-center">
                                    <p className="mb-6 font-sans text-gray-600">
                                        {t('noRecord')}
                                    </p>
                                    <Button onClick={() => router.push('/memo-cards')}>
                                        {t('startReview')}
                                    </Button>
                                </div>
                            ) : !isAllCompleted ? (
                                activeItems.map((item) => (
                                    // <StudyCard
                                    //     key={item.id}
                                    //     {...item}
                                    //     onComplete={() => handleComplete(item.id)}
                                    //     onShowMemoCard={() => handleShowMemoCard(item.memo_card)}
                                    // />
                                    <></>
                                ))
                            ) : (
                                <CompletionMessage key="completion" />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}


interface StudyCardProps {
    id: number
    type: string
    question: string
    answer: string
    onComplete: (id: number) => void
    onShowMemoCard?: () => void
}

export function StudyCard({
    id,
    type,
    question,
    answer,
    onComplete,
    onShowMemoCard,
}: StudyCardProps) {
    const [isChecked, setIsChecked] = useState(false)
    const [isVisible, setIsVisible] = useState(true)

    const handleCheck = () => {
        setIsChecked(true)
        // 先触发动画，然后再调用onComplete
        setTimeout(() => setIsVisible(false), 100)
        // 确保在动画完成后调用onComplete
        setTimeout(() => onComplete(id), 600)
    }

    return (
        <div>
            <AnimatePresence mode="sync">
                {isVisible && (
                    <motion.div
                        layout
                        initial={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{
                            opacity: 0,
                            x: -100,
                            height: 0,
                            marginTop: 0,
                            transition: {
                                opacity: { duration: 0.4, ease: "easeOut" },
                                x: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
                                height: { duration: 0.3, delay: 0.1 },
                                marginTop: { duration: 0.3, delay: 0.1 }
                            }
                        }}
                        className="group mt-[24px]"
                    >
                        <motion.div
                            className="flex items-center gap-4 bg-white dark:bg-black shadow-sm px-4 py-6 border border-[#1d283a] rounded-xl"
                            initial={{ y: 0 }}
                            exit={{ y: 0 }}
                        >
                            <AnimatedCheckbox checked={isChecked} onChange={handleCheck} />

                            <div className="flex-1 min-w-0 text-[18px]">
                                <div className="flex items-center gap-4">
                                    {type === 'listening' && <AudioPlayer originalText={answer} />}
                                    <p className="text-[15px] text-gray-700 truncate">{question}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <ScribbleReveal content={answer} onContentClick={onShowMemoCard} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}