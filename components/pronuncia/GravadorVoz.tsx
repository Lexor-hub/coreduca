'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GravadorVozProps {
    onRecordingComplete: (audioBlob: Blob) => void
    isProcessing: boolean
}

export function GravadorVoz({ onRecordingComplete, isProcessing }: GravadorVozProps) {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const getMicrophonePermission = async () => {
        try {
            if ('MediaRecorder' in window) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                })
                return stream
            } else {
                alert('Seu navegador não suporta gravação de áudio.')
                return null
            }
        } catch {
            alert('Permissão de microfone negada.')
            return null
        }
    }

    const startRecording = async () => {
        const stream = await getMicrophonePermission()
        if (!stream) return

        setIsRecording(true)
        const media = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = media
        mediaRecorderRef.current.start(100)

        const localAudioChunks: Blob[] = []

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (typeof event.data === 'undefined') return
            if (event.data.size === 0) return
            localAudioChunks.push(event.data)
        }

        audioChunksRef.current = localAudioChunks
    }

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return

        setIsRecording(false)
        mediaRecorderRef.current.stop()

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            audioChunksRef.current = [] // clear internal memory

            // Stop all tracks to turn off recording light
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())

            onRecordingComplete(audioBlob)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            {isProcessing ? (
                <div className="w-24 h-24 rounded-full bg-[var(--color-coreduca-blue)]/10 flex items-center justify-center p-4">
                    <Loader2 className="w-12 h-12 text-[var(--color-coreduca-blue)] animate-spin" />
                </div>
            ) : (
                <motion.div
                    animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`relative rounded-full p-2 ${isRecording ? 'bg-red-100' : 'bg-[var(--color-coreduca-blue)]/10'}`}
                >
                    {isRecording && (
                        <motion.div
                            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full border-2 border-[var(--color-coreduca-red)]"
                        />
                    )}
                    <Button
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full shadow-lg ${isRecording
                                ? 'bg-[var(--color-coreduca-red)] hover:bg-[var(--color-coreduca-red)]/90 text-white'
                                : 'bg-[var(--color-coreduca-blue)] hover:bg-[var(--color-coreduca-blue)]/90 text-white'
                            }`}
                    >
                        {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
                    </Button>
                </motion.div>
            )}

            <div className="text-center">
                <p className={`text-sm font-semibold ${isRecording ? 'text-[var(--color-coreduca-red)] animate-pulse' : 'text-muted-foreground'}`}>
                    {isProcessing ? 'Analisando sua pronúncia...' : isRecording ? 'Gravando... Toque para parar' : 'Toque para gravar'}
                </p>
            </div>
        </div>
    )
}
