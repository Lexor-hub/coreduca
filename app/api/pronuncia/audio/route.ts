import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const itemId = typeof body?.item_id === "string" ? body.item_id : ""

  if (!itemId) {
    return NextResponse.json({ error: "item_id e obrigatorio" }, { status: 400 })
  }

  const { data: item } = await supabase
    .from("pronunciation_items")
    .select("id, frase_coreano, audio_modelo_url")
    .eq("id", itemId)
    .single()

  if (!item) {
    return NextResponse.json({ error: "Item de pronuncia nao encontrado" }, { status: 404 })
  }

  if (item.audio_modelo_url) {
    return NextResponse.json({ audio_url: item.audio_modelo_url })
  }

  if (!openai) {
    return NextResponse.json({ error: "OPENAI_API_KEY nao configurada" }, { status: 503 })
  }

  const speechResponse = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: item.frase_coreano,
  })

  const audioBuffer = Buffer.from(await speechResponse.arrayBuffer())
  const audioPath = `tts/${item.id}.mp3`

  await supabase.storage.from("audios").upload(audioPath, audioBuffer, {
    contentType: "audio/mpeg",
    upsert: true,
  })

  const { data } = supabase.storage.from("audios").getPublicUrl(audioPath)
  const audioUrl = data.publicUrl

  await supabase
    .from("pronunciation_items")
    .update({ audio_modelo_url: audioUrl })
    .eq("id", item.id)

  return NextResponse.json({ audio_url: audioUrl })
}
