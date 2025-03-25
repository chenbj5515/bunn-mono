'use client'

interface SkeuomorphicCardProps {
  children: React.ReactNode
  className?: string
}

export function SkeuomorphicCard({ children, className }: SkeuomorphicCardProps) {
  return (
    <div
      className="relative bg-white dark:bg-black p-6 border border-gray-100 dark:border-gray-800 rounded-2xl"
    >
    { children }
    </div >
  )
}