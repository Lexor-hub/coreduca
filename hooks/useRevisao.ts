import { useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Questao, MissaoAttempt } from '@/types/database'

export type EstadoRevisao = 'carregando' | 'vazio' | 'respondendo' | 'feedback' | 'concluido' | 'erro'

type RevisaoResultado = {
    total: number
    acertos: number
}

export function useRevisao(userId: string) {
    const supabaseRef = useRef(createBrowserClient())
    const [estado, setEstado] = useState<EstadoRevisao>('carregando')
    const [fila, setFila] = useState<Questao[]>([])
    const [indiceAtual, setIndiceAtual] = useState(0)
    const [ultimaRespostaCorreta, setUltimaRespostaCorreta] = useState<boolean | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [resultado, setResultado] = useState<RevisaoResultado | null>(null)
    const [totalQuestoes, setTotalQuestoes] = useState(0)
    const [acertos, setAcertos] = useState(0)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        if (!userId) return

        setEstado('carregando')
        setIndiceAtual(0)
        setUltimaRespostaCorreta(null)
        setSelectedAnswer(null)
        setResultado(null)
        setAcertos(0)
        setErro(null)

        const supabase = supabaseRef.current

        try {
            const { data: attempts, error: attemptsError } = await supabase
                .from('missao_attempts')
                .select('missao_id, respostas')
                .eq('user_id', userId)
                .eq('status', 'concluida')

            if (attemptsError) {
                throw attemptsError
            }

            if (!attempts || attempts.length === 0) {
                setFila([])
                setTotalQuestoes(0)
                setEstado('vazio')
                return
            }

            const errorCounts = new Map<string, number>()
            for (const attempt of attempts as MissaoAttempt[]) {
                if (!attempt.respostas) continue
                for (const [qId, answer] of Object.entries(attempt.respostas)) {
                    if (!answer.correta) {
                        errorCounts.set(qId, (errorCounts.get(qId) || 0) + 1)
                    }
                }
            }

            if (errorCounts.size === 0) {
                setFila([])
                setTotalQuestoes(0)
                setEstado('vazio')
                return
            }

            const questionIds = Array.from(errorCounts.keys())
            const { data: questoes, error: questoesError } = await supabase
                .from('questoes')
                .select('*')
                .in('id', questionIds)
                .eq('ativo', true)

            if (questoesError) {
                throw questoesError
            }

            if (!questoes || questoes.length === 0) {
                setFila([])
                setTotalQuestoes(0)
                setEstado('vazio')
                return
            }

            const weighted: Questao[] = []
            for (const q of questoes as Questao[]) {
                const count = Math.min(errorCounts.get(q.id) || 1, 3)
                for (let i = 0; i < count; i++) {
                    weighted.push(q)
                }
            }

            for (let i = weighted.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[weighted[i], weighted[j]] = [weighted[j], weighted[i]]
            }

            const capped = weighted.slice(0, 15)

            setFila(capped)
            setTotalQuestoes(capped.length)
            setEstado('respondendo')
        } catch (error) {
            console.error('Erro ao carregar revisao', error)
            setFila([])
            setTotalQuestoes(0)
            setErro('Nao foi possivel carregar sua revisao agora.')
            setEstado('erro')
        }
    }, [userId])

    const responder = useCallback((questaoId: string, respostaUsuario: string) => {
        const questao = fila[indiceAtual]
        if (!questao || estado === 'feedback') return

        let correta: boolean
        if (questao.tipo === 'completar_frase') {
            const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
            correta = normalize(respostaUsuario) === normalize(questao.resposta_correta)
        } else {
            correta = respostaUsuario === questao.resposta_correta
        }

        if (correta) setAcertos(prev => prev + 1)
        setSelectedAnswer(respostaUsuario)
        setUltimaRespostaCorreta(correta)
        setEstado('feedback')
    }, [estado, fila, indiceAtual])

    const avancar = useCallback(() => {
        setSelectedAnswer(null)
        setUltimaRespostaCorreta(null)

        const proximo = indiceAtual + 1
        if (proximo < fila.length) {
            setIndiceAtual(proximo)
            setEstado('respondendo')
        } else {
            setResultado({
                total: totalQuestoes,
                acertos,
            })
            setEstado('concluido')
        }
    }, [acertos, fila.length, indiceAtual, totalQuestoes])

    const questaoAtual = fila[indiceAtual] ?? null

    return {
        estado,
        questaoAtual,
        indiceAtual,
        totalQuestoes,
        ultimaRespostaCorreta,
        selectedAnswer,
        resultado,
        acertos,
        erro,
        carregar,
        responder,
        avancar,
    }
}

// Standalone function to count pending review questions for a user
export async function contarRevisaoPendente(userId: string, supabase: SupabaseClient): Promise<number> {
    const { data: attempts } = await supabase
        .from('missao_attempts')
        .select('respostas')
        .eq('user_id', userId)
        .eq('status', 'concluida')

    if (!attempts) return 0

    const errorIds = new Set<string>()
    for (const attempt of attempts as MissaoAttempt[]) {
        if (!attempt.respostas) continue
        for (const [qId, answer] of Object.entries(attempt.respostas)) {
            if (!answer.correta) errorIds.add(qId)
        }
    }

    return errorIds.size
}
