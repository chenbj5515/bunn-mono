'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedCheckbox } from './animated-checkbox'
import { ScribbleReveal } from './scribble-reveal'
import { AudioPlayer } from './audio-player'

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
            className="group mt-[14px]"
          >
            <motion.div 
              className="border border-[#1d283a] bg-white dark:bg-black rounded-xl shadow-sm px-4 py-6 flex items-center gap-4"
              initial={{ y: 0 }}
              exit={{ y: 0 }}
            >
              <AnimatedCheckbox checked={isChecked} onChange={handleCheck} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4">
                  {type === 'listening' && <AudioPlayer originalText={answer} />}
                  <p className="text-gray-700 text-[15px] truncate">{question}</p>
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

