import type { NivelCoreduca, Plano } from "@/types/database"

export function isPremium(plano: Plano | undefined | null): boolean {
  return plano === "premium_mensal" || plano === "premium_anual"
}

export function planoLabel(plano: Plano | undefined | null): string {
  switch (plano) {
    case "premium_mensal": return "Premium Mensal"
    case "premium_anual": return "Premium Anual"
    default: return "Free"
  }
}

export const nivelLabels: Record<NivelCoreduca, string> = {
  exploradora: "Exploradora",
  primeiros_passos: "Primeiros Passos",
  sobrevivencia: "Sobrevivencia",
  conversas_basicas: "Conversas Basicas",
  vida_real: "Vida Real",
  base_dominada: "Base Dominada",
}

export const nivelXpThresholds: Record<NivelCoreduca, number> = {
  exploradora: 100,
  primeiros_passos: 300,
  sobrevivencia: 700,
  conversas_basicas: 1500,
  vida_real: 3000,
  base_dominada: 5000,
}

export const personaEmojiMap: Record<string, string> = {
  soo: "👩‍🏫",
  jiwoo: "👩‍🦰",
  hana: "💃",
}

export const personaGradientMap: Record<string, string> = {
  soo: "from-blue-400 to-blue-600",
  jiwoo: "from-pink-400 to-rose-600",
  hana: "from-amber-400 to-orange-600",
}

export const communityReactionEmojis = ["❤️", "🔥", "😍", "👏"] as const
