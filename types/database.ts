export type Plano = "free" | "premium_mensal" | "premium_anual"

export type NivelCoreduca =
  | "exploradora"
  | "primeiros_passos"
  | "sobrevivencia"
  | "conversas_basicas"
  | "vida_real"
  | "base_dominada"

export type QuestionType =
  | "multipla_escolha"
  | "verdadeiro_falso"
  | "completar_frase"
  | "associar_par"
  | "coreano_para_portugues"
  | "portugues_para_coreano"

export type MissionStatus = "em_andamento" | "concluida" | "abandonada"
export type CommunityStatus = "ativo" | "moderado" | "removido"
export type CommunityPostKind =
  | "duvida"
  | "novidade"
  | "evento"
  | "grupo_evento"
  | "quero_ir"
  | "vitoria"
  | "livre"
export type CommunityContextType = "missao" | "pronuncia" | "evento" | "manual"

export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  dorama_favorito: string | null
  interesse_principal: string | null
  nivel_atual: NivelCoreduca
  xp_total: number
  streak_atual: number
  streak_maximo: number
  ultimo_acesso: string | null
  is_admin: boolean
  plano: Plano
  beta_access: boolean
  premium_granted_at: string | null
  premium_expires_at: string | null
  premium_granted_by: string | null
  billing_source: "none" | "manual"
  created_at: string
  updated_at: string
}

export type Badge = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  icone: string | null
  xp_recompensa: number
  ativo: boolean
}

export type UserBadge = {
  id: string
  earned_at: string
  badges: Badge
}

export type Trilha = {
  id: string
  slug: string
  titulo: string
  descricao: string | null
  ordem: number
  icone: string | null
  cor: string | null
  ativo: boolean
  created_at?: string
}

export type Missao = {
  id: string
  trilha_id: string
  titulo: string
  descricao: string | null
  ordem: number
  xp_recompensa: number
  badge_id: string | null
  ativo: boolean
  created_at?: string
}

export type QuestaoOpcao = string[]

export type Questao = {
  id: string
  missao_id: string
  tipo: QuestionType
  enunciado: string
  enunciado_coreano: string | null
  opcoes: QuestaoOpcao | null
  resposta_correta: string
  explicacao: string | null
  audio_url: string | null
  imagem_url: string | null
  ordem: number
  ativo: boolean
}

export type PublicQuestao = Omit<Questao, "resposta_correta">

export type QuizAnswer = {
  resposta: string
  correta: boolean
}

export type QuizAnswers = Record<string, QuizAnswer>
export type QuizSubmission = Record<string, { resposta: string }>

export type QuizCompletionResult = {
  score: number
  xp_ganho: number
  badge_slug: string | null
  badge_nome: string | null
  missoes_concluidas: number
  total_missoes: number
}

export type QuestionVerificationResult = {
  correta: boolean
  correctAnswer: string | null
  explanation: string | null
}

export type MissaoAttempt = {
  id: string
  user_id: string
  missao_id: string
  status: MissionStatus
  score: number | null
  xp_ganho: number
  respostas: QuizAnswers | null
  erros_pendentes: string[] | null
  iniciada_em: string
  concluida_em: string | null
}

export type PronunciationItem = {
  id: string
  frase_coreano: string
  transliteracao: string | null
  traducao: string
  audio_modelo_url: string | null
  dificuldade: "basico" | "intermediario" | "avancado"
  trilha_id: string | null
  tags: string[] | null
  ativo: boolean
  created_at?: string
}

export type PronunciationAttempt = {
  id: string
  user_id: string
  item_id: string
  audio_url: string | null
  transcricao_obtida: string | null
  score: number | null
  feedback: string | null
  palavras_chave_acertadas: string[] | null
  xp_ganho: number
  created_at: string
}

export type PronunciationBestScore = {
  user_id?: string
  item_id: string
  melhor_score: number
  total_tentativas: number
  media_score?: number
}

export type AIMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export type AIPersona = {
  id: string
  slug: string
  nome: string
  avatar_url: string | null
  descricao: string | null
  foco: string | null
  tom?: string | null
  system_prompt: string
  nivel_minimo?: NivelCoreduca | null
  energia_maxima_free: number
  energia_maxima_premium: number
  cor_tema: string | null
  ativo: boolean
  ordem?: number | null
}

export type PublicAIPersona = Omit<AIPersona, "system_prompt">

export type AISession = {
  id: string
  user_id: string
  persona_id: string
  mensagens: AIMessage[]
  energia_usada: number
  data: string
  created_at: string
  updated_at: string
}

export type CommunityChannel = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem?: number | null
  ativo: boolean
}

export type CommunityProfileSummary = {
  id?: string
  display_name: string | null
  username: string
  avatar_url: string | null
  nivel_atual?: NivelCoreduca
  streak_atual?: number
}

export type CommunityPost = {
  id: string
  user_id: string
  channel_id: string
  conteudo: string
  imagem_url: string | null
  post_kind: CommunityPostKind
  prompt_slug: string | null
  context_type: CommunityContextType | null
  context_id: string | null
  context_label: string | null
  context_date: string | null
  reacoes: Record<string, number> | null
  total_comentarios: number
  pinned: boolean
  status: CommunityStatus
  created_at: string
  updated_at: string
  profiles?: CommunityProfileSummary
  post_reactions?: Array<{ emoji: string; user_id: string }>
}

export type CommunityComment = {
  id: string
  post_id: string
  user_id: string
  conteudo: string
  status: CommunityStatus
  created_at: string
  profiles?: CommunityProfileSummary
}

export type StoreItem = {
  id: string
  titulo: string
  descricao: string | null
  tipo: "evento" | "workshop" | "kit" | "produto" | "experiencia" | null
  preco: number | null
  imagem_url: string | null
  link_externo: string | null
  destaque: boolean
  ativo: boolean
  data_evento: string | null
  ordem?: number | null
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type OnboardingCompletion = {
  id: string
  user_id: string
  respostas: Json | null
  completed_at: string
}

type PostReport = {
  id: string
  post_id: string
  user_id: string
  motivo: string
  status: "pendente" | "revisado" | "resolvido"
  created_at: string
}

export type BetaInvite = {
  email: string
  active: boolean
  default_plan: Plano
  invited_by: string | null
  note: string | null
  created_at: string
  activated_at: string | null
}

export type AdminAuditLog = {
  id: string
  actor_id: string
  target_user_id: string | null
  action: string
  payload: Json
  created_at: string
}

export type ApiRateLimit = {
  user_id: string
  route: string
  bucket_start: string
  count: number
}

export type ApiRateLimitResult = {
  allowed: boolean
  remaining: number
  request_count: number
  reset_at: string
}

export type ProfileEntitlementFields = Pick<
  Profile,
  | "plano"
  | "beta_access"
  | "premium_granted_at"
  | "premium_expires_at"
  | "premium_granted_by"
  | "billing_source"
>

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type ViewDefinition<Row> = {
  Row: Row
  Relationships: []
}

type UserBadgeRow = Omit<UserBadge, "badges"> & {
  user_id: string
  badge_id: string
}

type CommunityPostRow = Omit<CommunityPost, "profiles" | "post_reactions">
type CommunityCommentRow = Omit<CommunityComment, "profiles">

export type Database = {
  public: {
    Tables: {
      ai_personas: TableDefinition<AIPersona>
      ai_sessions: TableDefinition<AISession>
      badges: TableDefinition<Badge>
      community_channels: TableDefinition<CommunityChannel>
      community_comments: TableDefinition<CommunityCommentRow>
      community_posts: TableDefinition<CommunityPostRow>
      missoes: TableDefinition<Missao>
      missao_attempts: TableDefinition<MissaoAttempt>
      onboarding_completions: TableDefinition<OnboardingCompletion>
      post_reactions: TableDefinition<
        { post_id: string; user_id: string; emoji: string; created_at: string },
        { post_id: string; user_id: string; emoji: string },
        Partial<{ post_id: string; user_id: string; emoji: string; created_at: string }>
      >
      post_reports: TableDefinition<PostReport>
      profiles: TableDefinition<Profile>
      pronunciation_attempts: TableDefinition<PronunciationAttempt>
      pronunciation_items: TableDefinition<PronunciationItem>
      questoes: TableDefinition<Questao>
      beta_invites: TableDefinition<BetaInvite>
      admin_audit_log: TableDefinition<AdminAuditLog>
      api_rate_limits: TableDefinition<ApiRateLimit>
      store_items: TableDefinition<StoreItem>
      trilhas: TableDefinition<Trilha>
      user_badges: TableDefinition<
        UserBadgeRow,
        Partial<UserBadgeRow> & { user_id: string; badge_id: string },
        Partial<UserBadgeRow>
      >
      user_progress: TableDefinition<{
          user_id: string
          trilha_id: string
          total_missoes: number
          missoes_concluidas: number
          percentual: number
          updated_at: string
        }>
    }
    Views: {
      ai_personas_public: ViewDefinition<PublicAIPersona>
      profile_public_summary: ViewDefinition<CommunityProfileSummary>
      pronunciation_best_scores: ViewDefinition<PronunciationBestScore>
    }
    Functions: {
      consume_api_rate_limit: {
        Args: {
          p_route: string
          p_bucket_seconds: number
          p_limit: number
        }
        Returns: ApiRateLimitResult
      }
      finalizar_missao: {
        Args: {
          p_missao_id: string
          p_respostas: Json
        }
        Returns: QuizCompletionResult
      }
      grant_badge_by_slug: {
        Args: {
          uid: string
          badge_slug: string
        }
        Returns: string | null
      }
      incrementar_xp: {
        Args: {
          uid: string
          valor: number
          acao?: string
          referencia_id?: string | null
        }
        Returns: number
      }
      registrar_streak_diario: {
        Args: {
          uid: string
        }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
