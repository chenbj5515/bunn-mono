'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { History } from 'lucide-react'
import { SkeuomorphicCard } from './skeuomorphic-card'
import { StudyCard } from './study-card'
import { CompletionMessage } from './completion-message'
import { Button } from '../../../../packages/ui/components/button'
import { MemoCard } from '@/components/memo-card/memo-card'
import { useTranslations } from 'next-intl'
import { memoCard } from '@db/schema'
import type { InferSelectModel } from "drizzle-orm"

interface ReportData {
  date: string
  stats: {
    flashcards: number
    words: number
    score: number
  }
  studyItems: Array<{
    id: number
    type: string
    question: string
    answer: string
    memo_card?: InferSelectModel<typeof memoCard>
  }>
}

export default function DailyReport({ data }: { data: ReportData }) {
  const [activeItems, setActiveItems] = useState(data.studyItems)
  const [showMemoCard, setShowMemoCard] = useState(false)
  const [currentMemoCard, setCurrentMemoCard] = useState<InferSelectModel<typeof memoCard> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = useTranslations('dailyReport');

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
  const noStudyRecord = data.stats.flashcards === 0 && data.stats.words === 0 && data.stats.score === 0;

  return (
    <div className="pb-[14px]">
      {showMemoCard && currentMemoCard ? (
        <div className="top-[0] left-[0] z-[10000] fixed backdrop-blur-[3px] backdrop-saturate-[180%] w-[100vw] h-[100vh] overflow-scroll">
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
            <p className="font-NewYork text-[28px] text-gray-600 text-xl">{data.date}</p>
          </div>
          <div className="flex items-center gap-2 ml-auto font-medium text-base">
            <Link href="/daily-report/history" className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t('history.title')}
            </Link>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SkeuomorphicCard className='border-[#1d283a] dark:border-darkBorderColor boder'>
            <div className="grid grid-cols-3 divide-x">
              <div className="px-6 py-4 text-center">
                <h3 className="mb-1 font-mono font-semibold text-[16px]">{t('sentences')}</h3>
                <p className="font-bold text-gray-900 text-2xl">{data.stats.flashcards}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <h3 className="mb-1 font-mono font-semibold text-[16px]">{t('words')}</h3>
                <p className="font-bold text-gray-900 text-2xl">{data.stats.words}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <h3 className="mb-1 font-mono font-semibold text-[16px]">{t('test')}</h3>
                <p className="font-bold text-gray-900 text-2xl">{data.stats.score}</p>
              </div>
            </div>
          </SkeuomorphicCard>
        </motion.div>

        <motion.div className={`${!noStudyRecord && !isAllCompleted ? '' : 'mt-[14px]'}`}>
          <AnimatePresence mode="sync">
            {noStudyRecord ? (
              <div className="py-12 text-center">
                <p className="mb-6 font-sans text-[18px] text-gray-600">
                  {t('noRecord')}
                </p>
                <Button className='dark:bg-darkButtonBg w-[240px] h-[44px] text-[15px]' onClick={() => router.push('/memo-cards')}>
                  {t('startReview')}
                </Button>
              </div>
            ) : !isAllCompleted ? (
              activeItems.map((item) => (
                <StudyCard
                  key={item.id}
                  {...item}
                  onComplete={() => handleComplete(item.id)}
                  onShowMemoCard={() => item.memo_card && handleShowMemoCard(item.memo_card)}
                />
              ))
            ) : (
              <CompletionMessage key="completion" />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
