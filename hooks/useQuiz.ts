import { useState, useCallback, useRef, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Questao, QuizAnswers, QuizCompletionResult } from '@/types/database'

export type EstadoQuiz = 'carregando' | 'mini_licao' | 'respondendo' | 'feedback' | 'reforco' | 'concluido' | 'erro'
export type QuizNextStep = 'iniciar_quiz' | 'proxima_questao' | 'reforco' | 'seguir_reforco' | 'repetir_reforco' | 'conclusao'

export function useQuiz(missaoId: string, userId: string) {
    const supabaseRef = useRef(createBrowserClient())
    const [estado, setEstado] = useState<EstadoQuiz>('carregando')
    const [todasQuestoes, setTodasQuestoes] = useState<Questao[]>([])
    const [questoes, setQuestoes] = useState<Questao[]>([])
    const [indiceAtual, setIndiceAtual] = useState(0)
    const [errosPendentes, setErrosPendentes] = useState<string[]>([])
    const [respostas, setRespostas] = useState<QuizAnswers>({})
    const [ultimaRespostaCorreta, setUltimaRespostaCorreta] = useState<boolean | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [resultado, setResultado] = useState<QuizCompletionResult | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [filaReforco, setFilaReforco] = useState<Questao[]>([])
    const [emReforco, setEmReforco] = useState(false)
    const quizStateRef = useRef({
        estado,
        questoes,
        todasQuestoes,
        indiceAtual,
        errosPendentes,
        respostas,
        ultimaRespostaCorreta,
        filaReforco,
        emReforco,
    })

    useEffect(() => {
        quizStateRef.current = {
            estado,
            questoes,
            todasQuestoes,
            indiceAtual,
            errosPendentes,
            respostas,
            ultimaRespostaCorreta,
            filaReforco,
            emReforco,
        }
    }, [emReforco, errosPendentes, estado, filaReforco, indiceAtual, questoes, respostas, todasQuestoes, ultimaRespostaCorreta])

    const concluir = useCallback(async (finalResponses: QuizAnswers) => {
        if (!userId || !missaoId) return

        setErro(null)
        setEstado('carregando')

        try {
            const response = await fetch('/api/missoes/finalizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    missaoId,
                    respostas: finalResponses,
                }),
            })

            const payload = await response.json()

            if (!response.ok) {
                throw new Error(
                    typeof payload?.error === 'string'
                        ? payload.error
                        : 'Nao foi possivel concluir esta missao agora.'
                )
            }

            setResultado(payload as QuizCompletionResult)
            setEstado('concluido')
        } catch (error) {
            console.error('Erro ao concluir missao', error)
            setResultado(null)
            setErro(error instanceof Error ? error.message : 'Nao foi possivel concluir esta missao agora.')
            setEstado('erro')
        }
    }, [missaoId, userId])

    const iniciar = useCallback(async () => {
        setEstado('carregando')
        setIndiceAtual(0)
        setErrosPendentes([])
        setRespostas({})
        setUltimaRespostaCorreta(null)
        setSelectedAnswer(null)
        setResultado(null)
        setErro(null)
        setFilaReforco([])
        setEmReforco(false)

        const { data, error } = await supabaseRef.current
            .from('questoes')
            .select('*')
            .eq('missao_id', missaoId)
            .eq('ativo', true)
            .order('ordem')

        if (error) {
            console.error('Erro ao carregar questoes', error)
            setTodasQuestoes([])
            setQuestoes([])
            setErro('Nao foi possivel carregar as questoes desta missao.')
            setEstado('erro')
            return
        }

        const loadedQuestions = (data ?? []) as Questao[]
        setTodasQuestoes(loadedQuestions)
        setQuestoes(loadedQuestions)

        if (loadedQuestions.length > 0) {
            setEstado('mini_licao')
        } else {
            setResultado({
                score: 0,
                xp_ganho: 0,
                badge_slug: null,
                badge_nome: null,
                missoes_concluidas: 0,
                total_missoes: 0,
            })
            setEstado('concluido')
        }
    }, [missaoId])

    const comecarQuiz = useCallback(() => {
        setEstado('respondendo')
    }, [])

    const responder = useCallback((questaoId: string, respostaUsuario: string) => {
        const snapshot = quizStateRef.current
        const questao = snapshot.questoes.find((currentQuestion) => currentQuestion.id === questaoId)

        if (!questao || snapshot.estado === 'feedback') return

        let correta: boolean
        if (questao.tipo === 'completar_frase') {
            const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
            correta = normalize(respostaUsuario) === normalize(questao.resposta_correta)
        } else {
            correta = respostaUsuario === questao.resposta_correta
        }

        const respostasAtualizadas: QuizAnswers = {
            ...snapshot.respostas,
            [questaoId]: { resposta: respostaUsuario, correta },
        }
        const errosAtualizados = correta
            ? snapshot.errosPendentes.filter((id) => id !== questaoId)
            : Array.from(new Set([...snapshot.errosPendentes, questaoId]))

        setSelectedAnswer(respostaUsuario)
        setUltimaRespostaCorreta(correta)
        setRespostas(respostasAtualizadas)
        setErrosPendentes(errosAtualizados)
        setEstado('feedback')
    }, [])

    const avancar = useCallback(async () => {
        const snapshot = quizStateRef.current
        const wasCorrect = snapshot.ultimaRespostaCorreta

        setSelectedAnswer(null)
        setUltimaRespostaCorreta(null)

        if (snapshot.emReforco) {
            const filaAtual = snapshot.filaReforco

            if (filaAtual.length === 0) {
                setEmReforco(false)
                await concluir(snapshot.respostas)
                return
            }

            if (wasCorrect) {
                const novaFila = filaAtual.slice(1)
                setFilaReforco(novaFila)

                if (novaFila.length === 0) {
                    setEmReforco(false)
                    await concluir(snapshot.respostas)
                    return
                }

                setQuestoes(novaFila)
                setIndiceAtual(0)
            } else {
                const novaFila = [...filaAtual.slice(1), filaAtual[0]]
                setFilaReforco(novaFila)
                setQuestoes(novaFila)
                setIndiceAtual(0)
            }
            setEstado('reforco')
            return
        }

        const proximoIndice = snapshot.indiceAtual + 1

        if (proximoIndice < snapshot.questoes.length) {
            setIndiceAtual(proximoIndice)
            setEstado('respondendo')
            return
        }

        if (snapshot.errosPendentes.length > 0) {
            const questoesReforco = snapshot.todasQuestoes.filter((q) => snapshot.errosPendentes.includes(q.id))
            setFilaReforco(questoesReforco)
            setQuestoes(questoesReforco)
            setIndiceAtual(0)
            setErrosPendentes([])
            setEmReforco(true)
            setEstado('reforco')
            return
        }

        await concluir(snapshot.respostas)
    }, [concluir])

    let proximaAcao: QuizNextStep | null = null

    if (estado === 'mini_licao') {
        proximaAcao = 'iniciar_quiz'
    } else if (estado === 'feedback') {
        if (emReforco) {
            if (ultimaRespostaCorreta) {
                proximaAcao = filaReforco.length <= 1 ? 'conclusao' : 'seguir_reforco'
            } else {
                proximaAcao = 'repetir_reforco'
            }
        } else if (indiceAtual + 1 < questoes.length) {
            proximaAcao = 'proxima_questao'
        } else if (errosPendentes.length > 0) {
            proximaAcao = 'reforco'
        } else {
            proximaAcao = 'conclusao'
        }
    }

    return {
        estado, questoes, todasQuestoes, indiceAtual, errosPendentes, emReforco,
        ultimaRespostaCorreta, selectedAnswer, resultado, erro, proximaAcao,
        iniciar, comecarQuiz, responder, avancar
    }
}
