'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flag, MessageCircle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { communityReactionEmojis, parseAvatar, timeAgo } from '@/lib/coreduca'
import {
  formatCommunityContextDate,
  getCommunityPostKindMeta,
  normalizeCommunityClubSlug,
} from '@/lib/community'
import { MiniProfileSheet } from '@/components/comunidade/MiniProfileSheet'
import type { CommunityChannel, CommunityComment, CommunityPost } from '@/types/database'
import { createCommunityComment, toggleCommunityReaction } from '@/lib/community-actions'

const MAX_COMMENT_LENGTH = 160

type PostDetalhe = Pick<
  CommunityPost,
  | 'id'
  | 'channel_id'
  | 'conteudo'
  | 'post_kind'
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

type CommentItem = Pick<
  CommunityComment,
  'id' | 'post_id' | 'user_id' | 'conteudo' | 'status' | 'created_at'
> & {
  profiles?: CommunityComment['profiles']
}

export default function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params)
  const { user, profile } = useAuth()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [post, setPost] = useState<PostDetalhe | null>(null)
  const [channel, setChannel] = useState<CommunityChannel | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [miniProfileUserId, setMiniProfileUserId] = useState<string | null>(null)
  const [reactionPending, setReactionPending] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [reporting, setReporting] = useState(false)

  const loadPost = useCallback(async () => {
    const [{ data: postData, error: postError }, { data: commentsData, error: commentsError }] = await Promise.all([
      supabase
        .from('community_posts')
        .select('*, profiles(display_name, username, avatar_url), post_reactions(emoji, user_id)')
        .eq('id', postId)
        .single(),
      supabase
        .from('community_comments')
        .select('id, post_id, user_id, conteudo, status, created_at, profiles(display_name, username, avatar_url)')
        .eq('post_id', postId)
        .eq('status', 'ativo')
        .order('created_at'),
    ])

    if (postError || !postData) {
      return {
        post: null,
        comments: [] as CommentItem[],
        channel: null,
      }
    }

    const { data: channelData } = await supabase
      .from('community_channels')
      .select('id, slug, nome, descricao, icone, cor, ordem, ativo')
      .eq('id', postData.channel_id as string)
      .single()

    return {
      post: (postData as unknown as PostDetalhe) ?? null,
      comments: commentsError ? [] : (((commentsData as unknown) as CommentItem[]) || []),
      channel: (channelData as CommunityChannel | null) ?? null,
    }
  }, [postId, supabase])

  useEffect(() => {
    let active = true

    async function hydratePost() {
      setLoading(true)
      const snapshot = await loadPost()
      if (!active) return
      setPost(snapshot.post)
      setComments(snapshot.comments)
      setChannel(snapshot.channel)
      setLoading(false)
    }

    void hydratePost()

    return () => {
      active = false
    }
  }, [loadPost])

  const toggleReaction = async (emoji: string, reacted: boolean) => {
    if (!user || !post) return

    const previousPost = post
    const nextReactions = reacted
      ? (post.post_reactions || []).filter((reaction) => !(reaction.user_id === user.id && reaction.emoji === emoji))
      : [...(post.post_reactions || []), { emoji, user_id: user.id }]

    setReactionPending(true)
    setPost({
      ...post,
      post_reactions: nextReactions,
      reacoes: {
        ...(post.reacoes || {}),
        [emoji]: Math.max(0, Number(post.reacoes?.[emoji] ?? 0) + (reacted ? -1 : 1)),
      },
    })

    const { error } = await toggleCommunityReaction(supabase, {
      postId: post.id,
      userId: user.id,
      emoji,
      reacted,
    })

    if (error) {
      setPost(previousPost)
      setFeedback('Nao foi possivel atualizar sua reacao agora.')
    }

    setReactionPending(false)
  }

  const handleComment = async () => {
    const trimmedComment = comment.trim()

    if (!user || !trimmedComment || !post) return

    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      setFeedback('Sua resposta passou do limite de 160 caracteres.')
      return
    }

    const optimisticComment: CommentItem = {
      id: `temp-${Date.now()}`,
      post_id: post.id,
      user_id: user.id,
      conteudo: trimmedComment,
      status: 'ativo',
      created_at: new Date().toISOString(),
      profiles: profile ? {
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
      } : undefined,
    }

    const previousComments = comments
    const previousPost = post

    setCommentSubmitting(true)
    setComments((current) => [...current, optimisticComment])
    setPost({
      ...post,
      total_comentarios: post.total_comentarios + 1,
    })

    const { error } = await createCommunityComment(supabase, {
      postId: post.id,
      userId: user.id,
      conteudo: trimmedComment,
    })

    if (error) {
      setComments(previousComments)
      setPost(previousPost)
      setFeedback(error.message)
      setCommentSubmitting(false)
      return
    }

    setComment('')
    setFeedback('Resposta publicada com sucesso.')
    setCommentSubmitting(false)
  }

  const handleReport = async () => {
    if (!user || !post) return

    setReporting(true)
    const { error } = await supabase.from('post_reports').insert({
      post_id: post.id,
      user_id: user.id,
      motivo: 'Denuncia enviada pela tela do post.',
    })

    setFeedback(error ? error.message : 'Denuncia enviada para moderacao.')
    setReporting(false)
  }

  if (loading) {
    return (
      <>
        <TopBar title="Post" showBack backHref="/comunidade" />
        <div className="space-y-4 px-4 py-5">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </>
    )
  }

  if (!post) {
    return (
      <>
        <TopBar title="Post" showBack backHref="/comunidade" />
        <div className="px-4 py-5 text-sm text-muted-foreground">Post nao encontrado.</div>
      </>
    )
  }

  const postProfile = post.profiles
  const avatarParsed = parseAvatar(postProfile?.avatar_url)
  const initials = (postProfile?.display_name || postProfile?.username || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const userReactions = new Set(
    (post.post_reactions || [])
      .filter((reaction) => reaction.user_id === user?.id)
      .map((reaction) => reaction.emoji)
  )
  const kindMeta = getCommunityPostKindMeta(post.post_kind)
  const contextDate = formatCommunityContextDate(post.context_date)
  const clubSlug = normalizeCommunityClubSlug(channel?.slug) ?? channel?.slug ?? post.channel_id
  const clubLabel = normalizeCommunityClubSlug(channel?.slug)
    ? 'Ver clube'
    : 'Ver origem'

  return (
    <>
      <TopBar title="Post" showBack backHref={`/comunidade/${clubSlug}`} />
      <MiniProfileSheet userId={miniProfileUserId} onClose={() => setMiniProfileUserId(null)} />

      <div className="space-y-5 px-4 py-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setMiniProfileUserId(post.user_id)}>
                <Avatar className="h-10 w-10">
                  {avatarParsed ? (
                    <AvatarFallback className="text-xl" style={{ backgroundColor: avatarParsed.color }}>
                      {avatarParsed.emoji}
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>

              <div className="min-w-0 flex-1">
                <button onClick={() => setMiniProfileUserId(post.user_id)} className="truncate text-left text-sm font-bold hover:underline">
                  {postProfile?.display_name || postProfile?.username}
                </button>
                <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
              </div>

              <Button variant="ghost" size="icon" onClick={handleReport} aria-label="Denunciar post" disabled={reporting}>
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={`border-0 ${kindMeta.className}`}>{kindMeta.label}</Badge>
              {post.pinned && (
                <Badge className="border-0 bg-amber-100 text-amber-800">Destaque</Badge>
              )}
              {post.context_label && (
                <Badge variant="secondary">
                  {post.context_label}
                  {contextDate ? ` · ${contextDate}` : ''}
                </Badge>
              )}
            </div>

            <p className="text-sm leading-relaxed">{post.conteudo}</p>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
              {communityReactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji, userReactions.has(emoji))}
                  disabled={reactionPending}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    userReactions.has(emoji)
                      ? 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {emoji} {post.reacoes?.[emoji] ?? 0}
                </button>
              ))}

              <Link href={`/comunidade/${clubSlug}`} className="ml-auto text-xs font-semibold text-[var(--color-coreduca-blue)]">
                {clubLabel}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Respostas
              </h2>
            </div>

            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Escreva uma resposta curta..."
              className="min-h-24"
              maxLength={MAX_COMMENT_LENGTH}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{comment.length}/{MAX_COMMENT_LENGTH}</p>
              <Button
                onClick={handleComment}
                disabled={commentSubmitting || !comment.trim() || comment.trim().length > MAX_COMMENT_LENGTH}
                className="bg-[var(--color-coreduca-blue)] text-white"
              >
                {commentSubmitting ? 'Enviando...' : 'Responder'}
              </Button>
            </div>

            {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}

            <div className="space-y-3">
              {comments.map((communityComment, index) => (
                <motion.div
                  key={communityComment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl bg-secondary/40 px-4 py-3"
                >
                  <button onClick={() => setMiniProfileUserId(communityComment.user_id)} className="text-sm font-semibold hover:underline">
                    {communityComment.profiles?.display_name || communityComment.profiles?.username}
                  </button>
                  <p className="mt-1 text-sm leading-relaxed">{communityComment.conteudo}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{timeAgo(communityComment.created_at)}</p>
                </motion.div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">Ninguem respondeu isso ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
