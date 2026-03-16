import { useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Questao, QuizAnswers, QuizCompletionResult } from '@/types/database'

export type EstadoQuiz = 'carregando' | 'respondendo' | 'feedback' | 'reforco' | 'concluido' | 'erro'

export function useQuiz(missaoId: string, userId: string) {
    const supabase = createBrowserClient()
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

    const concluir = useCallback(async (finalResponses: QuizAnswers) => {
        if (!userId || !missaoId) return

        setErro(null)
        setEstado('carregando')

        const { data, error } = await supabase
            .rpc('finalizar_missao', {
                p_missao_id: missaoId,
                p_user_id: userId,
                p_respostas: finalResponses,
            })
            .single()

        if (error) {
            console.error('Erro ao concluir missao', error)
            setResultado(null)
            setErro('Nao foi possivel concluir esta missao agora.')
            setEstado('erro')
            return
        }

        setResultado(data as QuizCompletionResult)
        setEstado('concluido')
    }, [missaoId, userId, supabase])

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

        const { data, error } = await supabase
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
            setEstado('respondendo')
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
    }, [missaoId, supabase])

    // Responder questão
    const responder = useCallback(async (questaoId: string, resposta: string) => {
        const questao = questoes.find(q => q.id === questaoId)
        if (!questao || estado === 'feedback') return

        const correta = resposta === questao.resposta_correta
        const respostasAtualizadas: QuizAnswers = { ...respostas, [questaoId]: { resposta, correta } }
        const errosAtualizados = correta
            ? errosPendentes.filter((id) => id !== questaoId)
            : Array.from(new Set([...errosPendentes, questaoId]))

        setSelectedAnswer(resposta)
        setUltimaRespostaCorreta(correta)
        setRespostas(respostasAtualizadas)
        setErrosPendentes(errosAtualizados)
        setEstado('feedback')

        setTimeout(async () => {
            setSelectedAnswer(null)
            setUltimaRespostaCorreta(null)
            const proximoIndice = indiceAtual + 1

            if (proximoIndice < questoes.length) {
                setIndiceAtual(proximoIndice)
                setEstado('respondendo')
                return
            }

            if (errosAtualizados.length > 0) {
                setQuestoes(todasQuestoes.filter((currentQuestion) => errosAtualizados.includes(currentQuestion.id)))
                setIndiceAtual(0)
                setErrosPendentes([])
                setEstado('reforco')
                return
            }

            await concluir(respostasAtualizadas)
        }, 1200)
    }, [concluir, estado, errosPendentes, indiceAtual, questoes, respostas, todasQuestoes])

    return {
        estado, questoes, indiceAtual, errosPendentes,
        ultimaRespostaCorreta, selectedAnswer, resultado, erro, iniciar, responder
    }
}
