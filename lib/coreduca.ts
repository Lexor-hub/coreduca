import type { NivelCoreduca, Plano, Profile } from "@/types/database"

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

export const interestOptions = [
  { id: "doramas", label: "Doramas", emoji: "🎬", description: "Aprender com cenas, falas e referencias do universo dos dramas." },
  { id: "kpop", label: "K-pop", emoji: "🎵", description: "Estudar com letras, idols, fandom e cultura pop coreana." },
  { id: "viagem", label: "Viagem", emoji: "✈️", description: "Focar em situacoes reais para viajar com mais autonomia." },
  { id: "conversacao", label: "Conversacao", emoji: "💬", description: "Treinar falas do dia a dia e destravar a comunicacao." },
  { id: "tudo", label: "Tudo", emoji: "✨", description: "Misturar cultura, conversacao e jornada pratica." },
] as const

export const streakMilestones = [
  {
    threshold: 7,
    slug: "streak_7",
    nome: "Esquenta de Hongdae",
    icone: "🔥",
    descricao: "Acendeu sua rotina com 7 dias seguidos de estudo.",
    accentClass: "text-orange-700",
    surfaceClass: "bg-orange-100 text-orange-700",
    gradientClass: "from-orange-400 via-rose-500 to-pink-500",
  },
  {
    threshold: 30,
    slug: "streak_30",
    nome: "Flor de Mugunghwa",
    icone: "🌺",
    descricao: "Manteve 30 dias ativos com a resiliencia da flor simbolo da Coreia.",
    accentClass: "text-rose-700",
    surfaceClass: "bg-rose-100 text-rose-700",
    gradientClass: "from-rose-400 via-fuchsia-500 to-violet-500",
  },
  {
    threshold: 60,
    slug: "streak_60",
    nome: "Guardia do Hanok",
    icone: "🏯",
    descricao: "Construiu uma rotina firme por 60 dias, como um hanok que resiste ao tempo.",
    accentClass: "text-amber-700",
    surfaceClass: "bg-amber-100 text-amber-700",
    gradientClass: "from-amber-400 via-orange-500 to-red-500",
  },
  {
    threshold: 100,
    slug: "streak_100",
    nome: "Tigre de Joseon",
    icone: "🐯",
    descricao: "Alcancou 100 dias seguidos e virou lenda da constancia.",
    accentClass: "text-emerald-700",
    surfaceClass: "bg-emerald-100 text-emerald-700",
    gradientClass: "from-emerald-400 via-teal-500 to-cyan-500",
  },
] as const

type InterestOption = (typeof interestOptions)[number]

const interestMetaMap: Record<string, InterestOption & {
  accentClass: string
  surfaceClass: string
  gradientClass: string
}> = {
  doramas: {
    id: "doramas",
    label: "Doramas",
    emoji: "🎬",
    description: "Aprender com cenas, falas e referencias do universo dos dramas.",
    accentClass: "text-rose-700",
    surfaceClass: "bg-rose-100 text-rose-700",
    gradientClass: "from-rose-500 via-pink-500 to-orange-400",
  },
  kpop: {
    id: "kpop",
    label: "K-pop",
    emoji: "🎵",
    description: "Estudar com letras, idols, fandom e cultura pop coreana.",
    accentClass: "text-fuchsia-700",
    surfaceClass: "bg-fuchsia-100 text-fuchsia-700",
    gradientClass: "from-fuchsia-500 via-violet-500 to-indigo-500",
  },
  viagem: {
    id: "viagem",
    label: "Viagem",
    emoji: "✈️",
    description: "Focar em situacoes reais para viajar com mais autonomia.",
    accentClass: "text-sky-700",
    surfaceClass: "bg-sky-100 text-sky-700",
    gradientClass: "from-sky-500 via-cyan-500 to-emerald-400",
  },
  conversacao: {
    id: "conversacao",
    label: "Conversacao",
    emoji: "💬",
    description: "Treinar falas do dia a dia e destravar a comunicacao.",
    accentClass: "text-emerald-700",
    surfaceClass: "bg-emerald-100 text-emerald-700",
    gradientClass: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  tudo: {
    id: "tudo",
    label: "Tudo",
    emoji: "✨",
    description: "Misturar cultura, conversacao e jornada pratica.",
    accentClass: "text-amber-700",
    surfaceClass: "bg-amber-100 text-amber-700",
    gradientClass: "from-amber-400 via-orange-500 to-rose-500",
  },
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

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "agora"
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

export function parseAvatar(avatarUrl: string | null | undefined): { emoji: string; color: string } | null {
  if (!avatarUrl?.startsWith("emoji:")) return null
  const parts = avatarUrl.split(":")
  if (parts.length < 3) return null
  return { emoji: parts[1], color: parts[2] }
}

export function getInterestMeta(interesse: string | null | undefined) {
  if (interesse && interestMetaMap[interesse]) {
    return interestMetaMap[interesse]
  }

  return {
    id: "explorar",
    label: "Explorando",
    emoji: "🌱",
    description: "Complete seu perfil para receber uma experiencia mais personalizada.",
    accentClass: "text-[var(--color-coreduca-blue)]",
    surfaceClass: "bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]",
    gradientClass: "from-[var(--color-coreduca-blue)] via-cyan-500 to-indigo-500",
  }
}

export function calculateProfileCompletion(profile: Pick<Profile, "display_name" | "bio" | "avatar_url" | "dorama_favorito" | "interesse_principal"> | null) {
  const checklist = [
    { id: "display_name", label: "Nome de exibicao", complete: Boolean(profile?.display_name?.trim()) },
    { id: "bio", label: "Bio", complete: Boolean(profile?.bio?.trim()) },
    { id: "avatar", label: "Avatar", complete: Boolean(parseAvatar(profile?.avatar_url)) },
    { id: "interest", label: "Interesse principal", complete: Boolean(profile?.interesse_principal) },
    { id: "dorama", label: "Dorama favorito", complete: Boolean(profile?.dorama_favorito?.trim()) },
  ]

  const completed = checklist.filter((item) => item.complete).length
  return {
    checklist,
    completed,
    total: checklist.length,
    percentage: Math.round((completed / checklist.length) * 100),
  }
}

export function getCurrentStreakMilestone(streak: number) {
  return [...streakMilestones].reverse().find((item) => streak >= item.threshold) ?? null
}

export function getNextStreakMilestone(streak: number) {
  return streakMilestones.find((item) => streak < item.threshold) ?? null
}

export function formatLastSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return "Sem registro"

  const today = new Date()
  const target = new Date(dateStr)
  const diffInDays = Math.floor((today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) / 86400000)

  if (diffInDays <= 0) return "Hoje"
  if (diffInDays === 1) return "Ontem"
  if (diffInDays < 7) return `Ha ${diffInDays} dias`

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(target)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}
