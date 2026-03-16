'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, RotateCcw, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { CommunityTagFilter } from '@/components/comunidade/CommunityTagFilter'
import { PromptCard } from '@/components/comunidade/PromptCard'
import { CommunityPostCard } from '@/components/comunidade/CommunityPostCard'
import {
  PromptComposerSheet,
  type CommunityComposerPayload,
} from '@/components/comunidade/PromptComposerSheet'
import { MiniProfileSheet } from '@/components/comunidade/MiniProfileSheet'
import {
  coerceCommunityContextType,
  coerceCommunityPostKind,
  communityClubDefinitions,
  formatCommunityContextDate,
  getCommunitySourceSlugs,
  normalizeCommunityClubSlug,
  type CommunityClubSlug,
  type CommunityTagFilterValue,
} from '@/lib/community'
import { createCommunityPost, toggleCommunityReaction } from '@/lib/community-actions'
import type {
  CommunityChannel,
  CommunityContextType,
  CommunityPost,
  CommunityPostKind,
} from '@/types/database'

type ClubPagePost = Pick<
  CommunityPost,
  | 'id'
  | 'channel_id'
  | 'conteudo'
  | 'post_kind'
  | 'prompt_slug'
  | 'context_type'
  | 'context_id'
  | 'context_label'
  | 'context_date'
  | 'reacoes'
  | 'total_comentarios'
  | 'pinned'
  | 'status'
  | 'created_at'
  | 'updated_at'
  | 'user_id'
> & {
  profiles?: CommunityPost['profiles']
  post_reactions?: Array<{ emoji: string; user_id: string }>
}

type ComposerSeed = {
  promptSlug: string | null
  prefill: string | null
  postKind: CommunityPostKind | null
  contextType: CommunityContextType | null
  contextId: string | null
  contextLabel: string | null
  contextDate: string | null
}

const emptyComposerSeed: ComposerSeed = {
  promptSlug: null,
  prefill: null,
  postKind: null,
  contextType: null,
  contextId: null,
  contextLabel: null,
  contextDate: null,
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default function CanalPage({ params }: { params: Promise<{ canalId: string }> }) {
  const { canalId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createBrowserClient(), [])
  const { user } = useAuth()

  const requestedClubSlug = isUuid(canalId) ? null : normalizeCommunityClubSlug(canalId)
  const searchCompose = searchParams.get('compose') === '1'

  const searchComposerSeed = useMemo<ComposerSeed>(() => ({
    promptSlug: searchParams.get('prompt_slug'),
    prefill: searchParams.get('prefill'),
    postKind: searchParams.get('post_kind') ? coerceCommunityPostKind(searchParams.get('post_kind')) : null,
    contextType: coerceCommunityContextType(searchParams.get('context_type')),
    contextId: searchParams.get('context_id'),
    contextLabel: searchParams.get('context_label'),
    contextDate: searchParams.get('context_date'),
  }), [searchParams])

  const [clubSlug, setClubSlug] = useState<CommunityClubSlug | null>(requestedClubSlug)
  const [sourceChannels, setSourceChannels] = useState<CommunityChannel[]>([])
  const [postingChannel, setPostingChannel] = useState<CommunityChannel | null>(null)
  const [posts, setPosts] = useState<ClubPagePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerSubmitting, setComposerSubmitting] = useState(false)
  const [composerError, setComposerError] = useState<string | null>(null)
  const [composerSeed, setComposerSeed] = useState<ComposerSeed>(searchComposerSeed)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<CommunityTagFilterValue>('all')
  const [miniProfileUserId, setMiniProfileUserId] = useState<string | null>(null)
  const [pendingReactionPostId, setPendingReactionPostId] = useState<string | null>(null)

  const applyReactionLocally = useCallback((postId: string, emoji: string, reacted: boolean, userId: string) => {
    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post

      const currentReactions = post.post_reactions || []
      const nextReactions = reacted
        ? currentReactions.filter((reaction) => !(reaction.user_id === userId && reaction.emoji === emoji))
        : [...currentReactions, { emoji, user_id: userId }]
      const currentCount = Number(post.reacoes?.[emoji] ?? 0)

      return {
        ...post,
        post_reactions: nextReactions,
        reacoes: {
          ...(post.reacoes || {}),
          [emoji]: Math.max(0, currentCount + (reacted ? -1 : 1)),
        },
      }
    }))
  }, [])

  const loadClub = useCallback(async () => {
    setLoading(true)
    setError(null)

    let resolvedClubSlug = requestedClubSlug
    let requestedChannel: CommunityChannel | null = null

    if (isUuid(canalId)) {
      const { data: channelData, error: channelError } = await supabase
        .from('community_channels')
        .select('id, slug, nome, descricao, icone, cor, ordem, ativo')
        .eq('id', canalId)
        .single()

      if (channelError || !channelData) {
        setClubSlug(null)
        setSourceChannels([])
        setPostingChannel(null)
        setPosts([])
        setError('Nao foi possivel carregar esse clube agora.')
        setLoading(false)
        return
      }

      requestedChannel = channelData as CommunityChannel
      resolvedClubSlug = normalizeCommunityClubSlug(requestedChannel.slug)
    }

    if (!resolvedClubSlug) {
      setClubSlug(null)
      setSourceChannels([])
      setPostingChannel(null)
      setPosts([])
      setError('Esse clube nao esta disponivel agora.')
      setLoading(false)
      return
    }

    const sourceSlugs = getCommunitySourceSlugs(resolvedClubSlug)
    const { data: channelsData, error: channelsError } = await supabase
      .from('community_channels')
      .select('id, slug, nome, descricao, icone, cor, ordem, ativo')
      .in('slug', sourceSlugs)
      .eq('ativo', true)
      .order('ordem')

    if (channelsError) {
      setClubSlug(resolvedClubSlug)
      setSourceChannels([])
      setPostingChannel(null)
      setPosts([])
      setError('Nao foi possivel carregar esse clube agora.')
      setLoading(false)
      return
    }

    const loadedChannels = ((channelsData as CommunityChannel[]) ?? [])
    const nextSourceChannels = loadedChannels.length > 0
      ? loadedChannels
      : requestedChannel
        ? [requestedChannel]
        : []
    const nextPostingChannel = nextSourceChannels.find((channel) => channel.slug === resolvedClubSlug)
      ?? nextSourceChannels[0]
      ?? null

    let loadedPosts: ClubPagePost[] = []
    let nextError: string | null = null

    if (nextSourceChannels.length > 0) {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*, profiles(display_name, username, avatar_url), post_reactions(emoji, user_id)')
        .in('channel_id', nextSourceChannels.map((channel) => channel.id))
        .eq('status', 'ativo')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (postsError) {
        nextError = 'O clube abriu, mas as conversas nao puderam ser carregadas.'
      } else {
        loadedPosts = ((postsData as unknown) as ClubPagePost[]) || []
      }
    }

    setClubSlug(resolvedClubSlug)
    setSourceChannels(nextSourceChannels)
    setPostingChannel(nextPostingChannel)
    setPosts(loadedPosts)
    setError(nextError)
    setLoading(false)
  }, [canalId, requestedClubSlug, supabase])

  useEffect(() => {
    void loadClub()
  }, [loadClub])

  useEffect(() => {
    setComposerSeed(searchComposerSeed)
  }, [searchComposerSeed])

  useEffect(() => {
    if (searchCompose && postingChannel) {
      setComposerSeed(searchComposerSeed)
      setComposerOpen(true)
    }
  }, [postingChannel, searchCompose, searchComposerSeed])

  const clearComposeParams = useCallback(() => {
    const activeClubSlug = clubSlug ?? requestedClubSlug
    if (!activeClubSlug) return
    router.replace(`/comunidade/${activeClubSlug}`)
  }, [clubSlug, requestedClubSlug, router])

  const openComposer = useCallback((overrides?: Partial<ComposerSeed>) => {
    if (!postingChannel) {
      setComposerError('Esse clube ainda nao esta pronto para receber compartilhamentos.')
      return
    }

    setComposerError(null)
    setComposerSeed({
      ...emptyComposerSeed,
      ...searchComposerSeed,
      ...overrides,
    })
    setComposerOpen(true)
  }, [postingChannel, searchComposerSeed])

  const handleCreatePost = useCallback(async (payload: CommunityComposerPayload) => {
    setComposerSubmitting(true)
    setComposerError(null)

    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user

    if (!currentUser) {
      setComposerSubmitting(false)
      setComposerError('Sua sessao expirou. Entre de novo para compartilhar.')
      return
    }

    const { error: insertError } = await createCommunityPost(supabase, {
      userId: currentUser.id,
      channelId: payload.channelId,
      conteudo: payload.conteudo,
      postKind: payload.postKind,
      promptSlug: payload.promptSlug,
      contextType: payload.contextType,
      contextId: payload.contextId,
      contextLabel: payload.contextLabel,
      contextDate: payload.contextDate,
    })

    setComposerSubmitting(false)

    if (insertError) {
      setComposerError(insertError.message)
      return
    }

    setComposerOpen(false)
    if (searchCompose) {
      clearComposeParams()
    }
    setSuccessMessage('Compartilhado com sucesso.')
    setTimeout(() => setSuccessMessage(null), 3000)
    await loadClub()
  }, [clearComposeParams, loadClub, searchCompose, supabase])

  const toggleReaction = useCallback(async (postId: string, emoji: string, reacted: boolean) => {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user

    if (!currentUser) return

    const previousPosts = posts
    setPendingReactionPostId(postId)
    applyReactionLocally(postId, emoji, reacted, currentUser.id)

    const { error } = await toggleCommunityReaction(supabase, {
      postId,
      userId: currentUser.id,
      emoji,
      reacted,
    })

    if (error) {
      setPosts(previousPosts)
      setError('Nao foi possivel atualizar sua reacao agora.')
    }

    setPendingReactionPostId(null)
  }, [applyReactionLocally, posts, supabase])

  const clubDefinition = clubSlug ? communityClubDefinitions[clubSlug] : null
  const visiblePosts = clubSlug === 'fandom' && selectedTag !== 'all'
    ? posts.filter((post) => coerceCommunityPostKind(post.post_kind) === selectedTag)
    : posts
  const curatedPosts = clubSlug === 'fandom'
    ? posts.filter((post) => post.pinned && ['novidade', 'evento'].includes(coerceCommunityPostKind(post.post_kind))).slice(0, 2)
    : []

  if (loading) {
    return (
      <>
        <TopBar title="Clube" showBack backHref="/comunidade" />
        <div className="space-y-4 px-4 py-5">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-3xl" />
          ))}
        </div>
      </>
    )
  }

  if (!clubDefinition) {
    return (
      <>
        <TopBar title="Clube" showBack backHref="/comunidade" />
        <div className="px-4 py-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">{error || 'Esse clube nao esta disponivel agora.'}</p>
              <Button onClick={() => router.push('/comunidade')} className="rounded-full">
                Voltar para comunidade
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
        <TopBar
          title={clubDefinition.title}
          showBack
          backHref="/comunidade"
          rightContent={
          <Button
            size="sm"
            className="rounded-full bg-[var(--color-coreduca-blue)] text-white"
            onClick={() => openComposer()}
            disabled={!postingChannel}
          >
            Compartilhar
          </Button>
        }
      />

      <PromptComposerSheet
        open={composerOpen}
        onOpenChange={(open) => {
          setComposerOpen(open)
          if (!open && searchCompose) {
            clearComposeParams()
          }
        }}
        clubOptions={postingChannel ? [{ id: postingChannel.id, slug: clubDefinition.slug }] : []}
        defaultClubSlug={clubDefinition.slug}
        lockedClub
        initialPromptSlug={composerSeed.promptSlug}
        initialPrefill={composerSeed.prefill}
        initialPostKind={composerSeed.postKind}
        initialContextType={composerSeed.contextType}
        initialContextId={composerSeed.contextId}
        initialContextLabel={composerSeed.contextLabel}
        initialContextDate={composerSeed.contextDate}
        submitLabel={clubDefinition.promptButtonLabel}
        loading={composerSubmitting}
        error={composerError}
        onSubmit={handleCreatePost}
      />

      <MiniProfileSheet userId={miniProfileUserId} onClose={() => setMiniProfileUserId(null)} />

      <div className="space-y-5 px-4 py-5">
        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
          </Card>
        )}

        {!postingChannel && (
          <Card className="border-0 bg-amber-50 shadow-sm">
            <CardContent className="p-4 text-sm text-amber-800">
              Esse clube ja aparece na nova experiencia, mas ainda precisa da migracao da comunidade para receber posts.
            </CardContent>
          </Card>
        )}

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,rgba(25,92,255,0.95)_100%)] text-white shadow-[0_24px_60px_rgba(19,32,52,0.18)]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">{clubDefinition.eyebrow}</p>
                  <h1 className="text-2xl font-black">{clubDefinition.title}</h1>
                  <p className="max-w-md text-sm leading-relaxed text-white/75">{clubDefinition.description}</p>
                </div>
                <div className="rounded-[1.75rem] bg-white/12 px-4 py-3 text-center backdrop-blur">
                  <p className="text-4xl">{clubDefinition.icon}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="border-0 bg-white/12 text-white">{visiblePosts.length} conversas</Badge>
                {clubDefinition.slug === 'fandom' && (
                  <Badge className="border-0 bg-white/12 text-white">Novidades, eventos e wishlist</Badge>
                )}
                {sourceChannels.length > 1 && (
                  <Badge className="border-0 bg-white/12 text-white">Migrando canais antigos para um clube so</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {clubDefinition.slug === 'fandom' && clubDefinition.tagOptions && (
          <CommunityTagFilter options={clubDefinition.tagOptions} activeValue={selectedTag} onChange={setSelectedTag} />
        )}

        {clubDefinition.slug === 'fandom' && curatedPosts.length > 0 && selectedTag === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
              <p className="text-sm font-bold">Em destaque agora</p>
            </div>
            <div className="space-y-3">
              {curatedPosts.map((post) => {
                const contextDate = formatCommunityContextDate(post.context_date)

                return (
                  <Card key={post.id} className="border-0 bg-[linear-gradient(180deg,#ffffff,rgba(235,243,255,0.72))] shadow-sm">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge className="border-0 bg-rose-100 text-rose-700">Curadoria quente</Badge>
                        {post.context_label && (
                          <span className="font-semibold">
                            {post.context_label}
                            {contextDate ? ` · ${contextDate}` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold leading-relaxed">{post.conteudo}</p>
                      <Button variant="outline" className="rounded-full" onClick={() => router.push(`/comunidade/post/${post.id}`)}>
                        Abrir conversa
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Comece por aqui</p>
              <p className="text-xs text-muted-foreground">Escolha um prompt ou abra do seu jeito.</p>
            </div>
            <Button
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() => openComposer({ promptSlug: null })}
              disabled={!postingChannel}
            >
              {clubDefinition.freeformLabel}
            </Button>
          </div>

          <div className="grid gap-3">
            {clubDefinition.prompts.map((prompt) => (
              <PromptCard
                key={prompt.slug}
                prompt={prompt}
                onClick={() => openComposer({
                  promptSlug: prompt.slug,
                  postKind: prompt.postKind,
                })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Conversas do clube</p>
            {clubDefinition.slug === 'fandom' && selectedTag !== 'all' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Filtro ativo
              </div>
            )}
          </div>

          {visiblePosts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-3 p-6 text-center">
                <p className="text-2xl">{clubDefinition.icon}</p>
                <p className="text-lg font-bold">{clubDefinition.emptyTitle}</p>
                <p className="text-sm text-muted-foreground">{clubDefinition.emptyDescription}</p>
                <Button className="rounded-full" onClick={() => openComposer()} disabled={!postingChannel}>
                  {clubDefinition.promptButtonLabel}
                </Button>
              </CardContent>
            </Card>
          ) : (
            visiblePosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <CommunityPostCard
                  post={post}
                  currentUserId={user?.id ?? null}
                  href={`/comunidade/post/${post.id}`}
                  onToggleReaction={toggleReaction}
                  onOpenProfile={setMiniProfileUserId}
                  reactionDisabled={pendingReactionPostId === post.id}
                />
              </motion.div>
            ))
          )}
        </div>

        {error && (
          <div className="flex justify-center">
            <Button variant="outline" className="rounded-full" onClick={() => void loadClub()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
