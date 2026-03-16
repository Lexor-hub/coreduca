'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { getInterestMeta } from '@/lib/coreduca'
import {
  communityClubDefinitions,
  communityClubOrder,
  communityRelevantSlugs,
  getCommunitySourceSlugs,
  normalizeCommunityClubSlug,
  recommendCommunityClub,
  type CommunityClubSlug,
} from '@/lib/community'
import { CommunityHero } from '@/components/comunidade/CommunityHero'
import { ClubCard } from '@/components/comunidade/ClubCard'
import {
  PromptComposerSheet,
  type CommunityComposerPayload,
} from '@/components/comunidade/PromptComposerSheet'
import type { CommunityChannel } from '@/types/database'

type ClubSummary = {
  postCount: number
  latestSnippet: string | null
}

const CLUB_SUMMARY_LIMIT = 40

function isMissingCommunityColumns(message: string) {
  return message.includes('column') && message.includes('community_posts')
}

export default function ComunidadePage() {
  const { user, profile } = useAuth()
  const supabase = useMemo(() => createBrowserClient(), [])
  const [channels, setChannels] = useState<CommunityChannel[]>([])
  const [summaryMap, setSummaryMap] = useState<Record<CommunityClubSlug, ClubSummary>>({
    duvidas: { postCount: 0, latestSnippet: null },
    fandom: { postCount: 0, latestSnippet: null },
    vitorias: { postCount: 0, latestSnippet: null },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerError, setComposerError] = useState<string | null>(null)
  const [composerSubmitting, setComposerSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadCommunityHome = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: channelsData, error: channelsError } = await supabase
      .from('community_channels')
      .select('id, slug, nome, descricao, icone, cor, ordem, ativo')
      .in('slug', communityRelevantSlugs)
      .eq('ativo', true)
      .order('ordem')

    if (channelsError) {
      setChannels([])
      setError('Nao foi possivel carregar os clubes agora.')
      setLoading(false)
      return
    }

    const loadedChannels = ((channelsData as CommunityChannel[]) || []).filter((channel) =>
      normalizeCommunityClubSlug(channel.slug) !== null
    )

    setChannels(loadedChannels)

    const nextSummaryMap: Record<CommunityClubSlug, ClubSummary> = {
      duvidas: { postCount: 0, latestSnippet: null },
      fandom: { postCount: 0, latestSnippet: null },
      vitorias: { postCount: 0, latestSnippet: null },
    }

    try {
      const summaryResults = await Promise.all(
        communityClubOrder.map(async (clubSlug) => {
          const sourceSlugs = getCommunitySourceSlugs(clubSlug)
          const clubChannels = loadedChannels.filter((channel) => sourceSlugs.includes(channel.slug))

          if (clubChannels.length === 0) {
            return [clubSlug, nextSummaryMap[clubSlug]] as const
          }

          const channelIds = clubChannels.map((channel) => channel.id)
          const [{ count, error: countError }, { data: latestData, error: latestError }] = await Promise.all([
            supabase
              .from('community_posts')
              .select('id', { count: 'exact', head: true })
              .in('channel_id', channelIds)
              .eq('status', 'ativo'),
            supabase
              .from('community_posts')
              .select('conteudo')
              .in('channel_id', channelIds)
              .eq('status', 'ativo')
              .order('created_at', { ascending: false })
              .limit(1),
          ])

          if (countError || latestError) {
            throw new Error('Os clubes foram carregados, mas o resumo das conversas falhou.')
          }

          return [
            clubSlug,
            {
              postCount: count ?? 0,
              latestSnippet: latestData?.[0]?.conteudo?.slice(0, CLUB_SUMMARY_LIMIT * 3) ?? null,
            },
          ] as const
        })
      )

      summaryResults.forEach(([clubSlug, summary]) => {
        nextSummaryMap[clubSlug] = summary
      })
    } catch {
      setError('Os clubes foram carregados, mas o resumo das conversas falhou.')
    }

    setSummaryMap(nextSummaryMap)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadCommunityHome()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [loadCommunityHome])

  const handleCreatePost = useCallback(async (payload: CommunityComposerPayload) => {
    if (!user) return

    setComposerSubmitting(true)
    setComposerError(null)

    const insertPayload = {
      user_id: user.id,
      channel_id: payload.channelId,
      conteudo: payload.conteudo,
      post_kind: payload.postKind,
      prompt_slug: payload.promptSlug,
      context_type: payload.contextType,
      context_id: payload.contextId,
      context_label: payload.contextLabel,
      context_date: payload.contextDate,
    }

    let insertError: { message: string } | null = null
    const { error } = await supabase.from('community_posts').insert(insertPayload)
    insertError = error ? { message: error.message } : null

    if (insertError && isMissingCommunityColumns(insertError.message)) {
      const fallback = await supabase.from('community_posts').insert({
        user_id: user.id,
        channel_id: payload.channelId,
        conteudo: payload.conteudo,
      })
      insertError = fallback.error ? { message: fallback.error.message } : null
    }

    setComposerSubmitting(false)

    if (insertError) {
      setComposerError(insertError.message)
      return
    }

    setComposerOpen(false)
    setSuccessMessage('Compartilhado com sucesso.')
    setTimeout(() => setSuccessMessage(null), 3000)
    await loadCommunityHome()
  }, [loadCommunityHome, supabase, user])

  const recommendedClubSlug = recommendCommunityClub(profile?.interesse_principal)
  const recommendedClub = communityClubDefinitions[recommendedClubSlug]
  const interestMeta = getInterestMeta(profile?.interesse_principal)
  const clubOptions = communityClubOrder
    .map((clubSlug) => {
      const sourceSlugs = getCommunitySourceSlugs(clubSlug)
      const preferredChannel = channels.find((channel) => channel.slug === clubSlug)
        ?? channels.find((channel) => sourceSlugs.includes(channel.slug))

      if (!preferredChannel) return null

      return { id: preferredChannel.id, slug: clubSlug }
    })
    .filter((option): option is { id: string; slug: CommunityClubSlug } => option !== null)

  if (loading) {
    return (
      <>
        <TopBar title="Comunidade" />
        <div className="space-y-4 px-4 py-5">
          <Skeleton className="h-44 rounded-3xl" />
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-3xl" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar
        title="Comunidade"
        rightContent={
          <Button
            size="icon"
            className="h-9 w-9 rounded-full bg-[var(--color-coreduca-blue)]"
            aria-label="Compartilhar"
            onClick={() => setComposerOpen(true)}
            disabled={clubOptions.length === 0}
          >
            <Plus className="h-5 w-5 text-white" />
          </Button>
        }
      />

      <PromptComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        clubOptions={clubOptions}
        defaultClubSlug={recommendedClubSlug}
        submitLabel="Compartilhar"
        loading={composerSubmitting}
        error={composerError}
        onSubmit={handleCreatePost}
      />

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

        <CommunityHero recommendedClub={recommendedClub} interestLabel={interestMeta.label} />

        <div className="space-y-3">
          {communityClubOrder.map((clubSlug) => (
            <ClubCard
              key={clubSlug}
              club={communityClubDefinitions[clubSlug]}
              href={`/comunidade/${clubSlug}`}
              recommended={clubSlug === recommendedClubSlug}
              postCount={summaryMap[clubSlug].postCount}
              latestSnippet={summaryMap[clubSlug].latestSnippet}
            />
          ))}
        </div>
      </div>
    </>
  )
}
