'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GravadorVozProps {
    onRecordingComplete: (audioBlob: Blob) => void
    isProcessing: boolean
    disabled?: boolean
    onError?: (message: string) => void
}

const RECORDER_CANDIDATE_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
]

function getSupportedMimeType() {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return ''
    }

    return RECORDER_CANDIDATE_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
}

export function GravadorVoz({ onRecordingComplete, isProcessing, disabled = false, onError }: GravadorVozProps) {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const audioMimeTypeRef = useRef('audio/webm')

    const stopTracks = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
    }, [])

    const resetRecorder = useCallback(() => {
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.onerror = null
        mediaRecorderRef.current = null
    }, [])

    const pushError = useCallback((message: string) => {
        onError?.(message)
    }, [onError])

    useEffect(() => {
        return () => {
            try {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop()
                }
            } catch {
                // noop
            } finally {
                stopTracks()
                resetRecorder()
            }
        }
    }, [resetRecorder, stopTracks])

    const getMicrophonePermission = async () => {
        try {
            if (!('MediaRecorder' in window) || !navigator.mediaDevices?.getUserMedia) {
                pushError('Seu navegador nao suporta gravacao de audio.')
                return null
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            })
            return stream
        } catch {
            pushError('Permissao de microfone negada ou indisponivel.')
            return null
        }
    }

    const startRecording = async () => {
        if (disabled || isProcessing) return

        const stream = await getMicrophonePermission()
        if (!stream) return

        const mimeType = getSupportedMimeType()
        let media: MediaRecorder

        try {
            media = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream)
        } catch {
            stopTracks()
            pushError('Nao foi possivel iniciar a gravacao neste dispositivo.')
            return
        }

        mediaStreamRef.current = stream
        mediaRecorderRef.current = media
        audioMimeTypeRef.current = media.mimeType || mimeType || 'audio/webm'
        const localAudioChunks: Blob[] = []

        media.ondataavailable = (event) => {
            if (typeof event.data === 'undefined') return
            if (event.data.size === 0) return
            localAudioChunks.push(event.data)
        }

        media.onerror = () => {
            setIsRecording(false)
            stopTracks()
            resetRecorder()
            pushError('A gravacao falhou antes de ser concluida. Tente novamente.')
        }

        media.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: audioMimeTypeRef.current || 'audio/webm' })
            audioChunksRef.current = []
            setIsRecording(false)
            stopTracks()
            resetRecorder()

            if (audioBlob.size === 0) {
                pushError('Sua gravacao ficou vazia. Tente novamente.')
                return
            }

            onRecordingComplete(audioBlob)
        }

        audioChunksRef.current = localAudioChunks
        setIsRecording(true)
        media.start(100)
    }

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return

        try {
            mediaRecorderRef.current.stop()
        } catch {
            setIsRecording(false)
            stopTracks()
            resetRecorder()
            pushError('Nao foi possivel encerrar a gravacao. Tente novamente.')
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
                        disabled={disabled || isProcessing}
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
