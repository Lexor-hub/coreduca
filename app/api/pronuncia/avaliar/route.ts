import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

type PronunciationEvaluation = {
  score: number
  feedback: string
  dica: string
  palavras_acertadas: string[]
}

function normalizeEvaluation(input: unknown): PronunciationEvaluation {
  if (!input || typeof input !== "object") {
    return {
      score: 0,
      feedback: "Nao foi possivel avaliar sua tentativa agora.",
      dica: "Tente gravar novamente em um lugar mais silencioso.",
      palavras_acertadas: [],
    }
  }

  const raw = input as Record<string, unknown>

  return {
    score: Math.max(0, Math.min(100, Number(raw.score) || 0)),
    feedback:
      typeof raw.feedback === "string" && raw.feedback.trim().length > 0
        ? raw.feedback.trim()
        : "Boa tentativa! Continue praticando.",
    dica:
      typeof raw.dica === "string" && raw.dica.trim().length > 0
        ? raw.dica.trim()
        : "Repita mais devagar e articule cada silaba.",
    palavras_acertadas: Array.isArray(raw.palavras_acertadas)
      ? raw.palavras_acertadas.filter((value): value is string => typeof value === "string")
      : [],
  }
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  if (!openai) {
    return NextResponse.json({ error: "OPENAI_API_KEY nao configurada" }, { status: 503 })
  }

  const formData = await request.formData()
  const audioFile = formData.get("audio")
  const itemId = formData.get("item_id")

  if (!(audioFile instanceof File) || typeof itemId !== "string" || !itemId) {
    return NextResponse.json({ error: "audio e item_id sao obrigatorios" }, { status: 400 })
  }

  const { data: item } = await supabase
    .from("pronunciation_items")
    .select("id, frase_coreano, transliteracao, traducao")
    .eq("id", itemId)
    .single()

  if (!item) {
    return NextResponse.json({ error: "Item de pronuncia nao encontrado" }, { status: 404 })
  }

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "ko",
  })

  const transcricao = transcription.text.trim()
  const evaluationPrompt = `
Voce avalia pronuncia de coreano para iniciantes.

Frase alvo: "${item.frase_coreano}"
Transliteracao: "${item.transliteracao ?? ""}"
Traducao: "${item.traducao}"
Transcricao da aluna: "${transcricao}"

Responda somente com JSON neste formato:
{
  "score": 0,
  "feedback": "texto curto e encorajador em portugues",
  "dica": "dica curta em portugues",
  "palavras_acertadas": ["lista", "de", "palavras"]
}
`

  const evaluationCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 200,
    messages: [{ role: "user", content: evaluationPrompt }],
  })

  const parsed = normalizeEvaluation(
    JSON.parse(evaluationCompletion.choices[0]?.message?.content || "{}")
  )

  const xpGanho = parsed.score >= 90 ? 15 : parsed.score >= 70 ? 10 : parsed.score >= 50 ? 5 : 2
  const audioPath = `pronuncia/${user.id}/${item.id}/${Date.now()}.webm`
  const audioBuffer = await audioFile.arrayBuffer()

  await supabase.storage.from("audios").upload(audioPath, audioBuffer, {
    contentType: audioFile.type || "audio/webm",
    upsert: false,
  })

  await supabase.from("pronunciation_attempts").insert({
    user_id: user.id,
    item_id: item.id,
    audio_url: audioPath,
    transcricao_obtida: transcricao,
    score: parsed.score,
    feedback: parsed.feedback,
    palavras_chave_acertadas: parsed.palavras_acertadas,
    xp_ganho: xpGanho,
  })

  await supabase.rpc("incrementar_xp", {
    p_user_id: user.id,
    p_xp: xpGanho,
  })

  if (parsed.score >= 90) {
    await supabase.rpc("grant_badge_by_slug", {
      p_user_id: user.id,
      p_badge_slug: "pronuncia_90",
    })
  }

  return NextResponse.json({
    score: parsed.score,
    feedback: parsed.feedback,
    dica: parsed.dica,
    transcricao,
    xp_ganho: xpGanho,
  })
}
