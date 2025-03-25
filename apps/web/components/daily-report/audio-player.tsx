'use client'

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Button } from 'ui/components/button'
import { speakText } from '@utils/tts'

interface AudioPlayerProps {
  originalText: string
}

export function AudioPlayer({ originalText }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  function handlePlayBtn() {
    if (!isPlaying && originalText) {
      speakText(originalText, {
        voiceName: "ja-JP-NanamiNeural"
      }, () => setIsPlaying(false));
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="p-0 rounded-full w-8 h-8"
        onClick={handlePlayBtn}
        disabled={isPlaying}
      >
        {isPlaying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}