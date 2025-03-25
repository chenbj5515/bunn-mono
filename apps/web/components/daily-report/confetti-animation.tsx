'use client'

import { useEffect, useRef, useState } from 'react'
import confetti, { Shape } from 'canvas-confetti'

export function ConfettiAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = (rect.left + rect.right) / 2 / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    const defaults = { 
      startVelocity: 15, 
      spread: 360, 
      ticks: 100, 
      zIndex: 0,
      particleCount: 50,
      origin: { x, y },
      colors: ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'],
      shapes: ['circle', 'square'] as Shape[],
      scalar: 1,
      gravity: 0.5,
    }

    function triggerConfetti(delay: number) {
      setTimeout(() => {
        confetti(defaults)
      }, delay)
    }

    // Trigger confetti 3 times with delays
    triggerConfetti(0)    // Immediate
    triggerConfetti(1500) // After 1.5 seconds
    triggerConfetti(3000) // After 3 seconds

    // Hide the container after animations complete (3 seconds + animation duration)
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 4500) // 3000 (last animation) + 1500 (animation duration)

    return () => {
      confetti.reset()
      clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null
  return <div ref={containerRef} className="fixed inset-0" />
}