'use client'

import { useCallback, useEffect, useState } from 'react'

type SoundType = 'hover' | 'click' | 'success' | 'error' | 'pop'

/**
 * A simple hook to play UI interaction sounds without external heavy libraries.
 * It uses the native HTMLAudioElement and handles browser autoplay restrictions gracefully.
 */
export function useUISound() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [sounds, setSounds] = useState<Record<string, HTMLAudioElement>>({})

  // Initialize sounds on the first user interaction to bypass autoplay policies
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Pre-declare the paths. You will need to add these small mp3 files to public/sounds/
    // If they don't exist, the audio element simply fails silently (which is fine for UI enhancements).
    const soundUrls = {
      hover: '/sounds/hover.mp3', // Soft tick or swoosh
      click: '/sounds/click.mp3', // Snappy pop
      pop: '/sounds/pop.mp3',     // Bouncy pop for unlocks
    }

    const loadedSounds: Record<string, HTMLAudioElement> = {}

    // Preload audio elements
    Object.entries(soundUrls).forEach(([key, url]) => {
      const audio = new Audio(url)
      audio.volume = 0.2 // Keep UI sounds subtle
      loadedSounds[key] = audio
    })

    setSounds(loadedSounds)

    // Cleanup
    return () => {
      Object.values(loadedSounds).forEach(audio => {
        audio.src = ''
      })
    }
  }, [])

  const play = useCallback(
    (type: SoundType) => {
      try {
        const sound = sounds[type]
        if (sound) {
          // Clone the node so we can play overlapping sounds (e.g., rapid hovering)
          const clonedSound = sound.cloneNode() as HTMLAudioElement
          clonedSound.volume = sound.volume
          
          // Play and ignore the promise rejection if autoplay is blocked
          clonedSound.play().catch((e) => {
             // Browser blocked autoplay or file not found.
             // We fail silently because UI sounds are non-critical enhancements.
             // console.debug('Audio play skipped:', e.message)
          })
        }
      } catch (err) {
         // Failsafe
      }
    },
    [sounds]
  )

  return { play }
}
