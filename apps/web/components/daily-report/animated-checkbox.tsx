'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: () => void
}

export function AnimatedCheckbox({ checked, onChange }: AnimatedCheckboxProps) {
  return (
    <button
      onClick={onChange}
      className="relative size-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        backgroundColor: checked ? 'black' : 'transparent',
        border: checked ? 'none' : '2px solid black'
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        <Check className="size-3.5 text-white stroke-[3]" />
      </motion.div>
    </button>
  )
}