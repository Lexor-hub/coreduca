'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/TopBar'
import { GravadorVoz } from '@/components/pronuncia/GravadorVoz'
import { ScorePronuncia } from '@/components/pronuncia/ScorePronuncia'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { buildCommunityShareHref } from '@/lib/community'
import type { PronunciationAttempt, PronunciationItem } from '@/types/database'

type PracticeState = 'ready' | 'listening' | 'processing' | 'result'

function getAudioExtension(mimeType: string) {
    if (mimeType.includes('mp4')) return 'm4a'
    if (mimeType.includes('mpeg')) return 'mp3'
    if (mimeType.includes('ogg')) return 'ogg'
    if (mimeType.includes('wav')) return 'wav'
    return 'webm'
}

export default function PraticaPronunciaPage({ params }: { params: Promise<{ fraseId: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const supabase = useMemo(() => createBrowserClient(), [])

    const [item, setItem] = useState<PronunciationItem | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [attempts, setAttempts] = useState<PronunciationAttempt[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [state, setState] = useState<PracticeState>('ready')
    const [error, setError] = useState<string | null>(null)
    const [scoreInfo, setScoreInfo] = useState<{ score: number, feedback: string, dica: string, transcricao: string, xpGanho: number } | null>(null)
    const interactionLocked = state === 'listening' || state === 'processing'

    useEffect(() => {
        async function loadPracticeData() {
            setLoadingData(true)
            setError(null)

            const { data: itemData, error: itemError } = await supabase
                .from('pronunciation_items')
                .select('*')
                .eq('id', resolvedParams.fraseId)
                .single()

            if (itemError || !itemData) {
                setError('Nao foi possivel carregar esta frase de pronuncia.')
                setLoadingData(false)
                return
            }

            setItem(itemData)
            setAudioUrl(itemData.audio_modelo_url)

            if (user) {
                const { data: attemptsData } = await supabase
                    .from('pronunciation_attempts')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('item_id', itemData.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (attemptsData) {
                    setAttempts(attemptsData as PronunciationAttempt[])
                }
            }

            setLoadingData(false)
        }

        loadPracticeData()
    }, [resolvedParams.fraseId, supabase, user])

    const bestScore = attempts.reduce((highest, attempt) => Math.max(highest, attempt.score ?? 0), 0)

    const handlePlayModel = () => {
        void (async () => {
            if (!item) return

            setState('listening')
            setError(null)

            try {
                if (state === 'processing') return

                let finalAudioUrl = audioUrl

                if (!finalAudioUrl) {
                    const response = await fetch('/api/pronuncia/audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_id: item.id }),
                    })
                    const payload = await response.json()

                    if (!response.ok) {
                        throw new Error(payload.error || 'Nao foi possivel carregar o audio modelo.')
                    }

                    finalAudioUrl = payload.audio_url as string
                    setAudioUrl(finalAudioUrl)
                }

                const audio = new Audio(finalAudioUrl)
                audio.onended = () => setState('ready')
                audio.onerror = () => {
                    setState('ready')
                    setError('Nao foi possivel reproduzir o audio modelo agora.')
                }
                await audio.play()
            } catch (err) {
                setState('ready')
                setError(err instanceof Error ? err.message : 'Erro ao reproduzir o audio modelo.')
            }
        })()
    }

    const handleRecordingComplete = async (audioBlob: Blob) => {
        if (!item) return

        setState('processing')
        setError(null)

        const formData = new FormData()
        const mimeType = audioBlob.type || 'audio/webm'
        const filename = `gravacao.${getAudioExtension(mimeType)}`
        formData.append('audio', audioBlob, filename)
        formData.append('item_id', item.id)

        try {
            const response = await fetch('/api/pronuncia/avaliar', {
                method: 'POST',
                body: formData,
            })
            const payload = await response.json()

            if (!response.ok) {
                throw new Error(payload.error || 'Nao foi possivel avaliar sua pronuncia.')
            }

            setScoreInfo({
                score: payload.score as number,
                feedback: payload.feedback as string,
                dica: payload.dica as string,
                transcricao: payload.transcricao as string,
                xpGanho: payload.xp_ganho as number,
            })
            setAttempts((current) => [
                {
                    id: `temp-${Date.now()}`,
                    user_id: user?.id || '',
                    item_id: item.id,
                    audio_url: null,
                    transcricao_obtida: payload.transcricao as string,
                    score: payload.score as number,
                    feedback: payload.feedback as string,
                    palavras_chave_acertadas: [],
                    xp_ganho: payload.xp_ganho as number,
                    created_at: new Date().toISOString(),
                },
                ...current,
            ].slice(0, 5))
            setState('result')
        } catch (err) {
            setState('ready')
            setError(err instanceof Error ? err.message : 'Erro ao enviar sua gravacao.')
        }
    }

    const handleRetry = () => {
        setScoreInfo(null)
        setState('ready')
    }

    if (loadingData) {
        return (
            <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
                <TopBar title="Pronúncia" showBack backHref="/pronuncia" />
                <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-4">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-16 rounded-full" />
                    <Skeleton className="h-56 rounded-3xl" />
                </div>
            </div>
        )
    }

    if (!item) {
        return (
            <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
                <TopBar title="Pronúncia" showBack backHref="/pronuncia" />
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                    {error || 'Esta frase de pronuncia nao esta disponivel.'}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
            <TopBar title="Pronúncia" showBack backHref="/pronuncia" />

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full mb-20">
                <AnimatePresence mode="wait">
                    {state !== 'result' && (
                        <motion.div
                            key="practice-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="text-center mb-10">
                                <p className="text-3xl font-black mb-3 text-slate-900 drop-shadow-sm">{item.traducao}</p>
                                <p className="text-4xl font-extrabold mb-2 text-[var(--color-coreduca-blue)]">{item.frase_coreano}</p>
                                <p className="text-base text-slate-500 font-semibold mb-1">{item.transliteracao}</p>
                                {bestScore > 0 && (
                                    <p className="mt-3 text-sm font-semibold text-[var(--color-coreduca-red)]">
                                        Melhor score: {bestScore}%
                                    </p>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-full h-14 px-8 mb-12 gap-3 font-bold border-2"
                                onClick={handlePlayModel}
                                disabled={state === 'listening'}
                            >
                                <Volume2 className={`h-5 w-5 ${state === 'listening' ? 'animate-pulse text-[var(--color-coreduca-blue)]' : ''}`} />
                                {state === 'listening' ? 'Reproduzindo modelo...' : 'Ouvir pronúncia'}
                            </Button>

                            <GravadorVoz
                                onRecordingComplete={handleRecordingComplete}
                                isProcessing={state === 'processing'}
                                disabled={interactionLocked}
                                onError={setError}
                            />

                            {error && (
                                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            {attempts.length > 0 && (
                                <div className="mt-8 w-full rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Ultimas tentativas
                                    </p>
                                    <div className="space-y-3">
                                        {attempts.map((attempt) => (
                                            <div key={attempt.id} className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold">{attempt.transcricao_obtida || 'Sem transcricao'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(attempt.created_at).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-[var(--color-coreduca-blue)]">
                                                    {attempt.score ?? 0}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {state === 'result' && scoreInfo !== null && (
                        <motion.div
                            key="result-view"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <ScorePronuncia
                                score={scoreInfo.score}
                                feedback={scoreInfo.feedback}
                                transcricao={scoreInfo.transcricao}
                            />

                            <div className="mt-4 rounded-3xl bg-secondary/40 px-5 py-4 text-left text-sm text-muted-foreground">
                                <p className="font-semibold text-foreground">Dica</p>
                                <p className="mt-1">{scoreInfo.dica}</p>
                                <p className="mt-3 font-semibold text-[var(--color-coreduca-blue)]">
                                    +{scoreInfo.xpGanho} XP
                                </p>
                            </div>

                            <div className="grid w-full max-w-sm gap-3 mt-8">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-2xl h-14 font-bold border-2"
                                    onClick={() => {
                                        if (!item || !scoreInfo) return

                                        router.push(buildCommunityShareHref({
                                            clubSlug: 'vitorias',
                                            postKind: 'vitoria',
                                            promptSlug: 'consegui-pronunciar',
                                            contextType: 'pronuncia',
                                            contextId: item.id,
                                            contextLabel: item.frase_coreano,
                                            prefill: `Consegui pronunciar ${item.frase_coreano} com ${scoreInfo.score}% hoje e quis registrar essa conquista.`,
                                        }))
                                    }}
                                >
                                    Compartilhar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-2xl h-14 font-bold border-2"
                                    onClick={handleRetry}
                                >
                                    <RotateCcw className="h-5 w-5 mr-2" />
                                    Tentar de novo
                                </Button>
                                <Button
                                    className="flex-1 rounded-2xl h-14 font-bold bg-[var(--color-coreduca-blue)] hover:bg-[var(--color-coreduca-blue)]/90 text-white"
                                    onClick={() => router.push('/pronuncia')}
                                >
                                    Continuar
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
