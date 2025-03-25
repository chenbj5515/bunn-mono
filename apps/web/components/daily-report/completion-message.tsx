'use client'

import { motion } from 'framer-motion'
import { ConfettiAnimation } from './confetti-animation'
import { useTranslations } from 'next-intl'

export function CompletionMessage() {
  const t = useTranslations('dailyReport')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-[#1d283a] dark:border-darkBorderColor relative dark:bg-black bg-white rounded-[16px] shadow-sm px-6 py-12 text-center"
    >
      <ConfettiAnimation />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t('completion.congratulations')}
        </h3>
        <p className="text-[18px] whitespace-pre-line">
          {t('completion.message')}
        </p>
      </motion.div>
    </motion.div>
  )
}