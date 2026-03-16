import type { CommunityContextType, CommunityPostKind } from "@/types/database"

export const communityClubOrder = ["duvidas", "fandom", "vitorias"] as const

export type CommunityClubSlug = (typeof communityClubOrder)[number]
export type CommunityTagFilterValue = "all" | CommunityPostKind

export type CommunityPromptTemplate = {
  slug: string
  label: string
  description: string
  placeholder: string
  postKind: CommunityPostKind
  promptPrefix?: string
  requiresContextLabel?: boolean
  supportsContextDate?: boolean
}

export type CommunityClubDefinition = {
  slug: CommunityClubSlug
  title: string
  shortTitle: string
  eyebrow: string
  description: string
  icon: string
  accentClass: string
  surfaceClass: string
  gradientClass: string
  emptyTitle: string
  emptyDescription: string
  freeformLabel: string
  promptButtonLabel: string
  prompts: CommunityPromptTemplate[]
  tagOptions?: Array<{ value: CommunityTagFilterValue; label: string }>
}

export const communityClubDefinitions: Record<CommunityClubSlug, CommunityClubDefinition> = {
  duvidas: {
    slug: "duvidas",
    title: "Duvidas sem vergonha",
    shortTitle: "Duvidas",
    eyebrow: "Espaco seguro",
    description: "Pergunte do seu jeito e destrave o coreano com ajuda de quem tambem esta aprendendo.",
    icon: "🌱",
    accentClass: "text-[var(--color-coreduca-blue)]",
    surfaceClass: "bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]",
    gradientClass: "from-[var(--color-coreduca-blue)] via-cyan-500 to-indigo-500",
    emptyTitle: "Ninguem perguntou isso ainda",
    emptyDescription: "Abra a conversa com uma duvida simples e puxe outras iniciantes junto com voce.",
    freeformLabel: "Perguntar do seu jeito",
    promptButtonLabel: "Compartilhar duvida",
    prompts: [
      {
        slug: "como-fala",
        label: "Como fala ___ em coreano?",
        description: "Perfeito para palavras, expressoes e frases curtas.",
        placeholder: "Ex: Como fala \"estou com fome\" em coreano?",
        postKind: "duvida",
        promptPrefix: "Como fala",
      },
      {
        slug: "nao-entendi",
        label: "Nao entendi esta frase: ___",
        description: "Tire duvida de frase de quiz, dorama ou conversa.",
        placeholder: "Ex: Nao entendi esta frase: 안녕히 가세요",
        postKind: "duvida",
        promptPrefix: "Nao entendi esta frase:",
      },
      {
        slug: "me-explica",
        label: "Alguem me explica esta expressao/cena?",
        description: "Use quando a fala fizer sentido no contexto, mas nao na traducao.",
        placeholder: "Ex: Alguem me explica esta expressao que apareceu no dorama?",
        postKind: "duvida",
      },
    ],
  },
  fandom: {
    slug: "fandom",
    title: "Fandom & Eventos",
    shortTitle: "Fandom",
    eyebrow: "Cultura em movimento",
    description: "Novidades, eventos, wishlist e aquele papo de quem quer viver mais o universo coreano fora da tela.",
    icon: "🎬",
    accentClass: "text-rose-700",
    surfaceClass: "bg-rose-100 text-rose-700",
    gradientClass: "from-rose-500 via-fuchsia-500 to-orange-400",
    emptyTitle: "Esse canto ainda esta quieto",
    emptyDescription: "Traga uma novidade, um evento ou aquele desejo de ir que sempre rende conversa boa.",
    freeformLabel: "Compartilhar do seu jeito",
    promptButtonLabel: "Compartilhar no fandom",
    tagOptions: [
      { value: "all", label: "Tudo" },
      { value: "novidade", label: "Novidades" },
      { value: "evento", label: "Eventos" },
      { value: "quero_ir", label: "Quero ir" },
      { value: "grupo_evento", label: "Grupo do evento" },
    ],
    prompts: [
      {
        slug: "novidade-animou",
        label: "Novidade que me animou: ___",
        description: "Vale comeback, anuncio, noticia, teaser ou rumor quente.",
        placeholder: "Ex: A novidade que me animou foi o fanmeeting do ator em Sao Paulo.",
        postKind: "novidade",
      },
      {
        slug: "evento-acompanhar",
        label: "Evento que eu quero acompanhar: ___",
        description: "Marque nome e, se tiver, a data para organizar a conversa.",
        placeholder: "Ex: Quero acompanhar o show do grupo em agosto.",
        postKind: "evento",
        requiresContextLabel: true,
        supportsContextDate: true,
      },
      {
        slug: "quero-muito-ir",
        label: "Quero muito ir em: ___",
        description: "Use para wishlist, sonhos e planos de viagem ou evento.",
        placeholder: "Ex: Quero muito ir em um fanmeeting quando tiver aqui.",
        postKind: "quero_ir",
      },
      {
        slug: "grupo-evento",
        label: "Alguem vai ou quer falar sobre este evento?",
        description: "Abra um post para reunir quem quer comentar ou combinar a conversa.",
        placeholder: "Ex: Quem quer comentar esse evento comigo?",
        postKind: "grupo_evento",
        requiresContextLabel: true,
        supportsContextDate: true,
      },
    ],
  },
  vitorias: {
    slug: "vitorias",
    title: "Vitorias do dia",
    shortTitle: "Vitorias",
    eyebrow: "Progresso visivel",
    description: "Compartilhe pequenas conquistas para manter o ritmo e dar coragem para outras alunas.",
    icon: "🏆",
    accentClass: "text-amber-700",
    surfaceClass: "bg-amber-100 text-amber-700",
    gradientClass: "from-amber-400 via-orange-500 to-rose-500",
    emptyTitle: "Hoje ainda nao teve comemoracao aqui",
    emptyDescription: "Uma missao fechada ou uma pronuncia melhor ja valem um post curto para marcar o progresso.",
    freeformLabel: "Compartilhar conquista",
    promptButtonLabel: "Compartilhar vitoria",
    prompts: [
      {
        slug: "missao-concluida",
        label: "Fechei uma missao hoje",
        description: "Conte o que voce concluiu e como se sentiu.",
        placeholder: "Ex: Fechei uma missao hoje e finalmente memorizei essa expressao.",
        postKind: "vitoria",
      },
      {
        slug: "mantive-streak",
        label: "Mantive meu streak",
        description: "Vale para celebrar constancia, mesmo com pouco tempo.",
        placeholder: "Ex: Mantive meu streak hoje mesmo com o dia corrido.",
        postKind: "vitoria",
      },
      {
        slug: "consegui-pronunciar",
        label: "Consegui pronunciar/falar: ___",
        description: "Compartilhe uma fala, frase ou destrava de pronuncia.",
        placeholder: "Ex: Consegui pronunciar essa frase sem travar hoje.",
        postKind: "vitoria",
      },
    ],
  },
}

export const legacyCommunityClubMap: Record<string, CommunityClubSlug> = {
  iniciantes: "duvidas",
  vocabulario: "duvidas",
  doramas: "fandom",
  kpop: "fandom",
  viagem: "fandom",
  novidades: "fandom",
}

const communitySourceSlugMap: Record<CommunityClubSlug, string[]> = {
  duvidas: ["duvidas", "iniciantes", "vocabulario"],
  fandom: ["fandom", "doramas", "kpop", "viagem", "novidades"],
  vitorias: ["vitorias"],
}

export const communityRelevantSlugs = Array.from(
  new Set(communityClubOrder.flatMap((clubSlug) => communitySourceSlugMap[clubSlug]))
)

const postKindMeta: Record<CommunityPostKind, { label: string; className: string }> = {
  duvida: { label: "Duvida", className: "bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]" },
  novidade: { label: "Novidade", className: "bg-rose-100 text-rose-700" },
  evento: { label: "Evento", className: "bg-fuchsia-100 text-fuchsia-700" },
  grupo_evento: { label: "Grupo do evento", className: "bg-orange-100 text-orange-700" },
  quero_ir: { label: "Quero ir", className: "bg-sky-100 text-sky-700" },
  vitoria: { label: "Vitoria", className: "bg-amber-100 text-amber-700" },
  livre: { label: "Livre", className: "bg-secondary text-muted-foreground" },
}

const validPostKinds = new Set<CommunityPostKind>([
  "duvida",
  "novidade",
  "evento",
  "grupo_evento",
  "quero_ir",
  "vitoria",
  "livre",
])

const validContextTypes = new Set<CommunityContextType>([
  "missao",
  "pronuncia",
  "evento",
  "manual",
])

export function getCommunityClub(slug: string | null | undefined) {
  if (!slug || !isCommunityClubSlug(slug)) return null
  return communityClubDefinitions[slug]
}

export function isCommunityClubSlug(value: string): value is CommunityClubSlug {
  return communityClubOrder.includes(value as CommunityClubSlug)
}

export function recommendCommunityClub(interesse: string | null | undefined): CommunityClubSlug {
  if (interesse === "doramas" || interesse === "kpop" || interesse === "viagem") {
    return "fandom"
  }

  return "duvidas"
}

export function normalizeCommunityClubSlug(slug: string | null | undefined): CommunityClubSlug | null {
  if (!slug) return null
  if (isCommunityClubSlug(slug)) return slug
  return legacyCommunityClubMap[slug] ?? null
}

export function getCommunitySourceSlugs(clubSlug: CommunityClubSlug) {
  return communitySourceSlugMap[clubSlug]
}

export function getCommunityPrompt(clubSlug: CommunityClubSlug, promptSlug: string | null | undefined) {
  if (!promptSlug) return null
  return communityClubDefinitions[clubSlug].prompts.find((prompt) => prompt.slug === promptSlug) ?? null
}

export function getCommunityPostKindMeta(kind: string | null | undefined) {
  if (kind && validPostKinds.has(kind as CommunityPostKind)) {
    return postKindMeta[kind as CommunityPostKind]
  }

  return postKindMeta.livre
}

export function coerceCommunityPostKind(kind: string | null | undefined): CommunityPostKind {
  if (kind && validPostKinds.has(kind as CommunityPostKind)) {
    return kind as CommunityPostKind
  }

  return "livre"
}

export function coerceCommunityContextType(type: string | null | undefined): CommunityContextType | null {
  if (type && validContextTypes.has(type as CommunityContextType)) {
    return type as CommunityContextType
  }

  return null
}

export function formatCommunityContextDate(dateStr: string | null | undefined) {
  if (!dateStr) return null

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parsed)
}

export function toContextDateIso(dateValue: string | null | undefined) {
  if (!dateValue) return null
  return new Date(`${dateValue}T12:00:00`).toISOString()
}

type CommunityShareHrefParams = {
  clubSlug: CommunityClubSlug
  postKind?: CommunityPostKind | null
  promptSlug?: string | null
  contextType?: CommunityContextType | null
  contextId?: string | null
  contextLabel?: string | null
  contextDate?: string | null
  prefill?: string | null
}

export function buildCommunityShareHref({
  clubSlug,
  postKind,
  promptSlug,
  contextType,
  contextId,
  contextLabel,
  contextDate,
  prefill,
}: CommunityShareHrefParams) {
  const params = new URLSearchParams()
  params.set("compose", "1")

  if (postKind) params.set("post_kind", postKind)
  if (promptSlug) params.set("prompt_slug", promptSlug)
  if (contextType) params.set("context_type", contextType)
  if (contextId) params.set("context_id", contextId)
  if (contextLabel) params.set("context_label", contextLabel)
  if (contextDate) params.set("context_date", contextDate)
  if (prefill) params.set("prefill", prefill)

  return `/comunidade/${clubSlug}?${params.toString()}`
}
