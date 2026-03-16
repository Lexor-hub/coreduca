'use client'

import { useCallback, useEffect, useMemo } from 'react'

type SoundType = 'hover' | 'click' | 'success' | 'error' | 'pop'

/**
 * A simple hook to play UI interaction sounds without external heavy libraries.
 * It uses the native HTMLAudioElement and handles browser autoplay restrictions gracefully.
 */
export function useUISound() {
  const sounds = useMemo<Record<string, HTMLAudioElement>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    const soundUrls = {
      hover: '/sounds/hover.mp3',
      click: '/sounds/click.mp3',
      pop: '/sounds/pop.mp3',
    }

    return Object.fromEntries(
      Object.entries(soundUrls).map(([key, url]) => {
        const audio = new Audio(url)
        audio.volume = 0.2
        return [key, audio]
      })
    )
  }, [])

  useEffect(() => {
    return () => {
      Object.values(sounds).forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [sounds])

  const play = useCallback(
    (type: SoundType) => {
      try {
        const sound = sounds[type]
        if (sound) {
          // Clone the node so we can play overlapping sounds (e.g., rapid hovering)
          const clonedSound = sound.cloneNode() as HTMLAudioElement
          clonedSound.volume = sound.volume
          
          // Play and ignore the promise rejection if autoplay is blocked
          clonedSound.play().catch(() => {
             // Browser blocked autoplay or file not found.
             // We fail silently because UI sounds are non-critical enhancements.
          })
        }
      } catch {
         // Failsafe
      }
    },
    [sounds]
  )

  return { play }
}
