import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase/server"
import type { AIMessage } from "@/types/database"

export const runtime = "nodejs"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function sanitizeHistory(history: unknown): AIMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .filter(
      (item): item is AIMessage =>
        Boolean(
          item &&
            typeof item === "object" &&
            "role" in item &&
            "content" in item &&
            (item.role === "user" || item.role === "assistant" || item.role === "system") &&
            typeof item.content === "string"
        )
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-12)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const personaId = typeof body?.persona_id === "string" ? body.persona_id : ""
  const mensagem = typeof body?.mensagem === "string" ? body.mensagem.trim() : ""
  const historico = sanitizeHistory(body?.historico)

  if (!personaId || !mensagem) {
    return NextResponse.json({ error: "persona_id e mensagem sao obrigatorios" }, { status: 400 })
  }

  const [{ data: persona }, { data: profile }] = await Promise.all([
    supabase
      .from("ai_personas")
      .select("id, slug, nome, system_prompt, energia_maxima_free, energia_maxima_premium")
      .eq("id", personaId)
      .eq("ativo", true)
      .single(),
    supabase.from("profiles").select("plano").eq("id", user.id).single(),
  ])

  if (!persona) {
    return NextResponse.json({ error: "Persona nao encontrada" }, { status: 404 })
  }

  const today = new Date().toISOString().split("T")[0]
  const { data: session } = await supabase
    .from("ai_sessions")
    .select("mensagens, energia_usada")
    .eq("user_id", user.id)
    .eq("persona_id", persona.id)
    .eq("data", today)
    .maybeSingle()

  const userIsPremium = profile?.plano === "premium_mensal" || profile?.plano === "premium_anual"
  const energiaMax = userIsPremium ? persona.energia_maxima_premium : persona.energia_maxima_free
  const energiaUsada = session?.energia_usada ?? 0

  if (energiaUsada >= energiaMax) {
    return NextResponse.json(
      {
        error: "Energia esgotada",
        energia_usada: energiaUsada,
        energia_max: energiaMax,
      },
      { status: 429 }
    )
  }

  if (!openai) {
    return NextResponse.json({ error: "OPENAI_API_KEY nao configurada" }, { status: 503 })
  }

  const conversationHistory =
    session?.mensagens && Array.isArray(session.mensagens)
      ? sanitizeHistory(session.mensagens)
      : historico

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: "system", content: persona.system_prompt },
      ...conversationHistory,
      { role: "user", content: mensagem },
    ],
  })

  const resposta =
    completion.choices[0]?.message?.content?.trim() ||
    "Desculpe, nao consegui responder agora. Tente novamente."

  const novoHistorico: AIMessage[] = [
    ...conversationHistory,
    { role: "user", content: mensagem },
    { role: "assistant", content: resposta },
  ]

  await supabase.from("ai_sessions").upsert(
    {
      user_id: user.id,
      persona_id: persona.id,
      data: today,
      mensagens: novoHistorico,
      energia_usada: energiaUsada + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,persona_id,data" }
  )

  if (energiaUsada === 0) {
    await supabase.rpc("incrementar_xp", {
      p_user_id: user.id,
      p_xp: 5,
    })
  }

  return NextResponse.json({
    resposta,
    energia_usada: energiaUsada + 1,
    energia_max: energiaMax,
  })
}
