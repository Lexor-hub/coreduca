'use client'

import { useEffect, use, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizCard } from '@/components/quiz/QuizCard'
import { QuizFeedback } from '@/components/quiz/QuizFeedback'
import { QuizResultado } from '@/components/quiz/QuizResultado'
import { MiniLicao } from '@/components/quiz/MiniLicao'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Missao, Trilha } from '@/types/database'

type MissaoMeta = Pick<Missao, 'id' | 'trilha_id' | 'titulo' | 'descricao' | 'ordem' | 'xp_recompensa'>
type TrilhaMeta = Pick<Trilha, 'id' | 'titulo' | 'icone' | 'cor'>

export default function MissaoQuizPage({ params }: { params: Promise<{ missaoId: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const userId = user?.id ?? null
    const supabase = createBrowserClient()
    const [missao, setMissao] = useState<MissaoMeta | null>(null)
    const [trilha, setTrilha] = useState<TrilhaMeta | null>(null)
    const [questionCount, setQuestionCount] = useState(0)
    const [loadingMeta, setLoadingMeta] = useState(true)

    const {
        estado,
        questoes,
        todasQuestoes,
        indiceAtual,
        emReforco,
        ultimaRespostaCorreta,
        selectedAnswer,
        resultado,
        erro,
        iniciar,
        comecarQuiz,
        responder,
        avancar,
    } = useQuiz(resolvedParams.missaoId, userId || '')

    useEffect(() => {
        if (userId) {
            void iniciar()
        }
    }, [userId, iniciar])

    useEffect(() => {
        async function fetchMeta() {
            setLoadingMeta(true)

            const { data: missaoData } = await supabase
                .from('missoes')
                .select('id, trilha_id, titulo, descricao, ordem, xp_recompensa')
                .eq('id', resolvedParams.missaoId)
                .single()

            if (!missaoData) {
                setMissao(null)
                setTrilha(null)
                setQuestionCount(0)
                setLoadingMeta(false)
                return
            }

            setMissao(missaoData)

            const [{ data: trilhaData }, { count }] = await Promise.all([
                supabase
                    .from('trilhas')
                    .select('id, titulo, icone, cor')
                    .eq('id', missaoData.trilha_id)
                    .single(),
                supabase
                    .from('questoes')
                    .select('id', { count: 'exact', head: true })
                    .eq('missao_id', resolvedParams.missaoId)
                    .eq('ativo', true),
            ])

            setTrilha(trilhaData ?? null)
            setQuestionCount(count ?? 0)
            setLoadingMeta(false)
        }

        void fetchMeta()
    }, [resolvedParams.missaoId, supabase])

    const returnHref = missao ? `/aprender/${missao.trilha_id}` : '/aprender'

    useEffect(() => {
        if (!authLoading && !userId) {
            router.replace('/login')
        }
    }, [authLoading, userId, router])

    if (authLoading || loadingMeta || estado === 'carregando') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-[var(--color-coreduca-blue)] animate-spin" />
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
            </div>
        )
    }

    if (estado === 'concluido' && resultado) {
        const progressoResumo =
            resultado.total_missoes > 0
                ? `${resultado.missoes_concluidas}/${resultado.total_missoes} missoes concluidas nesta trilha`
                : null

        return (
            <QuizResultado
                score={resultado.score}
                xpGanho={resultado.xp_ganho}
                badgeNome={resultado.badge_nome}
                progressoResumo={progressoResumo}
                onContinuar={() => router.push(returnHref)}
            />
        )
    }

    if (estado === 'erro') {
        return (
            <div className="min-h-screen bg-background px-4 py-6">
                <div className="mx-auto flex max-w-lg items-center gap-3">
                    <button onClick={() => router.push(returnHref)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <p className="text-sm font-semibold text-muted-foreground">Voltar para a trilha</p>
                </div>

                <div className="mx-auto mt-10 max-w-lg">
                    <Card className="border-0 shadow-md">
                        <CardContent className="space-y-4 p-6 text-center">
                            <Sparkles className="mx-auto h-8 w-8 text-[var(--color-coreduca-blue)]" />
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black">Nao deu para abrir o quiz</h1>
                                <p className="text-sm text-muted-foreground">
                                    {erro || 'Tente carregar esta missao novamente.'}
                                </p>
                            </div>
                            <Button onClick={() => iniciar()} className="w-full rounded-full">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Tentar novamente
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Mini-lesson screen
    if (estado === 'mini_licao') {
        return (
            <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                    <div className="max-w-lg mx-auto flex items-center gap-4">
                        <button onClick={() => router.push(returnHref)} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{missao?.titulo || 'Missao'}</p>
                            <p className="truncate text-xs text-muted-foreground">{trilha?.titulo || 'Aprender'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 pt-8">
                    <MiniLicao questoes={todasQuestoes} onComecar={comecarQuiz} />
                </div>
            </div>
        )
    }

    const questao = questoes[indiceAtual]

    if (!questao) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <p className="text-muted-foreground">Nenhuma questao encontrada nesta missao.</p>
                <button onClick={() => router.push(returnHref)} className="mt-4 text-blue-500 font-bold">Voltar</button>
            </div>
        )
    }

    const progress = ((indiceAtual + 1) / (questoes.length || 1)) * 100
    const shouldRenderQuestion = estado === 'respondendo' || estado === 'reforco' || estado === 'feedback'
    const isRetryRound = estado === 'reforco' || (estado === 'feedback' && emReforco)

    return (
        <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                <div className="max-w-lg mx-auto space-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push(returnHref)} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{missao?.titulo || 'Missao'}</p>
                            <p className="truncate text-xs text-muted-foreground">{trilha?.titulo || 'Aprender'}</p>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground min-w-[3rem] text-right">
                            {indiceAtual + 1}/{questoes.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-3 flex-1 [&>div]:bg-[var(--color-coreduca-blue)]" />
                        {isRetryRound && (
                            <Badge className="border-0 bg-amber-100 text-amber-800">
                                Reforco
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-0 bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]">
                            {questionCount || questoes.length} questoes
                        </Badge>
                        <Badge variant="secondary">
                            +{missao?.xp_recompensa ?? 0} XP
                        </Badge>
                        {trilha?.icone && (
                            <Badge variant="secondary">
                                {trilha.icone} Missao {missao?.ordem ?? indiceAtual + 1}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 overflow-y-auto pb-40">
                {missao?.descricao && (
                    <Card className="mb-4 border-0 bg-[var(--color-coreduca-blue)]/5 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-coreduca-blue)]">
                                Missao atual
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {missao.descricao}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pergunta {indiceAtual + 1}
                    </p>
                    <p className="text-right text-xs text-muted-foreground">
                        {isRetryRound ? 'Acerte para avancar.' : 'Responda para avancar.'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {shouldRenderQuestion && (
                        <QuizCard
                            key={questao.id + '-' + indiceAtual}
                            questao={questao}
                            disabled={estado === 'feedback'}
                            selectedAnswer={selectedAnswer}
                            correctAnswer={questao.resposta_correta}
                            onResponder={(resposta) => responder(questao.id, resposta)}
                        />
                    )}
                </AnimatePresence>
            </div>

            <QuizFeedback
                show={estado === 'feedback'}
                isCorrect={ultimaRespostaCorreta}
                correctAnswer={questao.resposta_correta}
                explanation={questao.explicacao}
                isRetryRound={isRetryRound}
                onAvancar={avancar}
            />
        </div>
    )
}
