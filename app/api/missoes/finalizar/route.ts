import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Missao, QuizAnswers, QuizCompletionResult } from '@/types/database'

type MissionRow = Pick<Missao, 'id' | 'trilha_id' | 'xp_recompensa'>

function calculateScore(respostas: QuizAnswers) {
  const totalRespostas = Object.keys(respostas).length
  const totalAcertos = Object.values(respostas).filter((resposta) => resposta.correta).length

  if (totalRespostas === 0) return 0

  return Math.round((totalAcertos / totalRespostas) * 100)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Sessao invalida. Faca login novamente.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const missaoId = typeof body?.missaoId === 'string' ? body.missaoId : null
  const respostas = body?.respostas && typeof body.respostas === 'object' ? (body.respostas as QuizAnswers) : null

  if (!missaoId || !respostas) {
    return NextResponse.json({ error: 'Dados invalidos para concluir a missao.' }, { status: 400 })
  }

  const { data: missao, error: missaoError } = await supabase
    .from('missoes')
    .select('id, trilha_id, xp_recompensa')
    .eq('id', missaoId)
    .eq('ativo', true)
    .single()

  if (missaoError || !missao) {
    return NextResponse.json({ error: 'Missao nao encontrada.' }, { status: 404 })
  }

  const mission = missao as MissionRow
  const score = calculateScore(respostas)
  const xpGanho = mission.xp_recompensa ?? 20

  const { data: existingAttempt } = await supabase
    .from('missao_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('missao_id', mission.id)
    .maybeSingle()

  const { error: attemptError } = await supabase
    .from('missao_attempts')
    .upsert(
      {
        user_id: user.id,
        missao_id: mission.id,
        status: 'concluida',
        score,
        xp_ganho: xpGanho,
        respostas,
        erros_pendentes: [],
        concluida_em: new Date().toISOString(),
      },
      { onConflict: 'user_id,missao_id' }
    )

  if (attemptError) {
    return NextResponse.json({ error: 'Nao foi possivel salvar o resultado da missao.' }, { status: 500 })
  }

  const shouldGrantXp = existingAttempt?.status !== 'concluida'

  if (shouldGrantXp) {
    const { error: xpError } = await supabase.rpc('incrementar_xp', {
      uid: user.id,
      valor: xpGanho,
      acao: 'missao_concluida',
      referencia_id: mission.id,
    })

    if (xpError) {
      console.error('incrementar_xp failed', xpError)
    }
  }

  const [{ count: totalMissoes, error: totalError }, { data: trilhaMissoes, error: trilhaMissoesError }] = await Promise.all([
    supabase
      .from('missoes')
      .select('id', { count: 'exact', head: true })
      .eq('trilha_id', mission.trilha_id)
      .eq('ativo', true),
    supabase
      .from('missoes')
      .select('id')
      .eq('trilha_id', mission.trilha_id)
      .eq('ativo', true),
  ])

  const missionIds = (trilhaMissoes ?? []).map((currentMission) => currentMission.id)
  let missoesConcluidas = 0
  const total = totalMissoes ?? missionIds.length

  if (!totalError && !trilhaMissoesError && missionIds.length > 0) {
    const { data: attempts, error: attemptsError } = await supabase
      .from('missao_attempts')
      .select('missao_id')
      .eq('user_id', user.id)
      .eq('status', 'concluida')
      .in('missao_id', missionIds)

    if (attemptsError) {
      console.error('fetch mission attempts failed', attemptsError)
    } else {
      missoesConcluidas = new Set((attempts ?? []).map((attempt) => attempt.missao_id)).size
    }
  } else if (totalError || trilhaMissoesError) {
    console.error('calculate user_progress failed', totalError || trilhaMissoesError)
  }

  const percentual = total === 0 ? 0 : Math.round((missoesConcluidas / total) * 100)

  if (total > 0) {
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          trilha_id: mission.trilha_id,
          missoes_concluidas: missoesConcluidas,
          total_missoes: total,
          percentual,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,trilha_id' }
      )

    if (progressError) {
      console.error('persist user_progress failed', progressError)
    }
  }

  const result: QuizCompletionResult = {
    score,
    xp_ganho: shouldGrantXp ? xpGanho : 0,
    badge_slug: null,
    badge_nome: null,
    missoes_concluidas: missoesConcluidas,
    total_missoes: total,
  }

  return NextResponse.json(result)
}
