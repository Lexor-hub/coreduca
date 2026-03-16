'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flag, MessageCircle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { communityReactionEmojis } from '@/lib/coreduca'
import type { CommunityComment, CommunityPost } from '@/types/database'

type PostDetalhe = Pick<
    CommunityPost,
    'id' | 'channel_id' | 'conteudo' | 'reacoes' | 'total_comentarios' | 'pinned' | 'status' | 'created_at' | 'updated_at' | 'user_id'
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

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    return `${days}d atrás`
}

export default function PostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = use(params)
    const { user } = useAuth()
    const supabase = createBrowserClient()
    const [post, setPost] = useState<PostDetalhe | null>(null)
    const [comments, setComments] = useState<CommentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [comment, setComment] = useState('')
    const [feedback, setFeedback] = useState<string | null>(null)

    const loadPost = useCallback(async () => {
        const [{ data: postData }, { data: commentsData }] = await Promise.all([
            supabase
                .from('community_posts')
                .select('id, channel_id, conteudo, reacoes, total_comentarios, pinned, status, created_at, updated_at, user_id, profiles(display_name, username, avatar_url), post_reactions(emoji, user_id)')
                .eq('id', postId)
                .single(),
            supabase
                .from('community_comments')
                .select('id, post_id, user_id, conteudo, status, created_at, profiles(display_name, username, avatar_url)')
                .eq('post_id', postId)
                .eq('status', 'ativo')
                .order('created_at'),
        ])

        return {
            post: (postData as PostDetalhe | null) ?? null,
            comments: ((commentsData as unknown) as CommentItem[]) || [],
        }
    }, [postId, supabase])

    useEffect(() => {
        let active = true

        async function hydratePost() {
            const snapshot = await loadPost()
            if (!active) return
            setPost(snapshot.post)
            setComments(snapshot.comments)
            setLoading(false)
        }

        void hydratePost()

        return () => {
            active = false
        }
    }, [loadPost])

    const toggleReaction = async (emoji: string, reacted: boolean) => {
        if (!user || !post) return

        if (reacted) {
            await supabase
                .from('post_reactions')
                .delete()
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .eq('emoji', emoji)
        } else {
            await supabase.from('post_reactions').insert({
                post_id: post.id,
                user_id: user.id,
                emoji,
            })
        }

        const snapshot = await loadPost()
        setPost(snapshot.post)
        setComments(snapshot.comments)
    }

    const handleComment = async () => {
        if (!user || !comment.trim() || !post) return

        const { error } = await supabase.from('community_comments').insert({
            post_id: post.id,
            user_id: user.id,
            conteudo: comment.trim(),
        })

        if (error) {
            setFeedback(error.message)
            return
        }

        setComment('')
        setFeedback('Comentário publicado com sucesso.')
        const snapshot = await loadPost()
        setPost(snapshot.post)
        setComments(snapshot.comments)
    }

    const handleReport = async () => {
        if (!user || !post) return

        const { error } = await supabase.from('post_reports').insert({
            post_id: post.id,
            user_id: user.id,
            motivo: 'Denúncia enviada pela tela do post.',
        })

        setFeedback(error ? error.message : 'Denúncia enviada para moderação.')
    }

    if (loading) {
        return (
            <>
                <TopBar title="Post" showBack />
                <div className="px-4 py-5 space-y-4">
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
                <TopBar title="Post" showBack />
                <div className="px-4 py-5 text-sm text-muted-foreground">Post não encontrado.</div>
            </>
        )
    }

    const initials = (post.profiles?.display_name || post.profiles?.username || 'U')
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

    return (
        <>
            <TopBar title="Post" showBack />
            <div className="px-4 py-5 space-y-5">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{post.profiles?.display_name || post.profiles?.username}</p>
                                <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleReport} aria-label="Denunciar post">
                                <Flag className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed">{post.conteudo}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {communityReactionEmojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => toggleReaction(emoji, userReactions.has(emoji))}
                                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${userReactions.has(emoji)
                                        ? 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]'
                                        : 'bg-secondary text-muted-foreground'
                                        }`}
                                >
                                    {emoji} {post.reacoes?.[emoji] ?? 0}
                                </button>
                            ))}
                            <Link href={`/comunidade/${post.channel_id}`} className="ml-auto text-xs font-semibold text-[var(--color-coreduca-blue)]">
                                Ver canal
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                Comentários
                            </h2>
                        </div>

                        <Textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="Escreva um comentário..."
                            className="min-h-24"
                        />
                        <div className="mt-3 flex justify-end">
                            <Button onClick={handleComment} disabled={!comment.trim()} className="bg-[var(--color-coreduca-blue)] text-white">
                                Comentar
                            </Button>
                        </div>
                        {feedback && <p className="mt-3 text-sm text-muted-foreground">{feedback}</p>}

                        <div className="mt-5 space-y-3">
                            {comments.map((communityComment, index) => (
                                <motion.div
                                    key={communityComment.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="rounded-2xl bg-secondary/40 px-4 py-3"
                                >
                                    <p className="text-sm font-semibold">
                                        {communityComment.profiles?.display_name || communityComment.profiles?.username}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed">{communityComment.conteudo}</p>
                                    <p className="mt-2 text-[10px] text-muted-foreground">
                                        {timeAgo(communityComment.created_at)}
                                    </p>
                                </motion.div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-sm text-muted-foreground">Ainda não há comentários neste post.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
