import { useState, useCallback, useRef, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Questao, QuizAnswers, QuizCompletionResult } from '@/types/database'

export type EstadoQuiz = 'carregando' | 'mini_licao' | 'respondendo' | 'feedback' | 'reforco' | 'concluido' | 'erro'

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
    // For reforço: track the queue of questions that need to be answered correctly
    const [filaReforco, setFilaReforco] = useState<Questao[]>([])
    const [emReforco, setEmReforco] = useState(false)
    // Ref to always have latest respostas in avancar() without stale closure
    const respostasRef = useRef(respostas)
    useEffect(() => { respostasRef.current = respostas }, [respostas])

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

    // Carregar questões
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

    // Transition from mini-lesson to quiz
    const comecarQuiz = useCallback(() => {
        setEstado('respondendo')
    }, [])

    // Responder questão — only sets feedback state, does NOT auto-advance
    const responder = useCallback((questaoId: string, respostaUsuario: string) => {
        const questao = questoes.find(q => q.id === questaoId)
        if (!questao || estado === 'feedback') return

        // For completar_frase, normalize comparison
        let correta: boolean
        if (questao.tipo === 'completar_frase') {
            const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
            correta = normalize(respostaUsuario) === normalize(questao.resposta_correta)
        } else {
            correta = respostaUsuario === questao.resposta_correta
        }

        const respostasAtualizadas: QuizAnswers = { ...respostas, [questaoId]: { resposta: respostaUsuario, correta } }
        const errosAtualizados = correta
            ? errosPendentes.filter((id) => id !== questaoId)
            : Array.from(new Set([...errosPendentes, questaoId]))

        setSelectedAnswer(respostaUsuario)
        setUltimaRespostaCorreta(correta)
        setRespostas(respostasAtualizadas)
        setErrosPendentes(errosAtualizados)
        setEstado('feedback')
    }, [estado, errosPendentes, questoes, respostas])

    // Manual advance — called when user clicks "Próxima"
    const avancar = useCallback(async () => {
        const wasCorrect = ultimaRespostaCorreta
        setSelectedAnswer(null)
        setUltimaRespostaCorreta(null)

        // If in reforço mode
        if (filaReforco.length > 0) {
            if (wasCorrect) {
                // Remove current question from queue
                const novaFila = filaReforco.slice(1)
                setFilaReforco(novaFila)
                if (novaFila.length === 0) {
                    setEmReforco(false)
                    await concluir(respostasRef.current)
                    return
                }
                setQuestoes(novaFila)
                setIndiceAtual(0)
            } else {
                // Rotate: move current question to the end
                const novaFila = [...filaReforco.slice(1), filaReforco[0]]
                setFilaReforco(novaFila)
                setQuestoes(novaFila)
                setIndiceAtual(0)
            }
            setEstado('reforco')
            return
        }

        // Normal flow
        const proximoIndice = indiceAtual + 1

        if (proximoIndice < questoes.length) {
            setIndiceAtual(proximoIndice)
            setEstado('respondendo')
            return
        }

        // End of first pass — check for errors
        if (errosPendentes.length > 0) {
            const questoesReforco = todasQuestoes.filter((q) => errosPendentes.includes(q.id))
            setFilaReforco(questoesReforco)
            setQuestoes(questoesReforco)
            setIndiceAtual(0)
            setErrosPendentes([])
            setEmReforco(true)
            setEstado('reforco')
            return
        }

        await concluir(respostasRef.current)
    }, [concluir, errosPendentes, filaReforco, indiceAtual, questoes, todasQuestoes, ultimaRespostaCorreta])

    return {
        estado, questoes, todasQuestoes, indiceAtual, errosPendentes, emReforco,
        ultimaRespostaCorreta, selectedAnswer, resultado, erro,
        iniciar, comecarQuiz, responder, avancar
    }
}
