'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { communityReactionEmojis } from '@/lib/coreduca'
import type { CommunityChannel, CommunityPost } from '@/types/database'

type PostFeedItem = Pick<
    CommunityPost,
    'id' | 'channel_id' | 'conteudo' | 'reacoes' | 'total_comentarios' | 'pinned' | 'status' | 'created_at' | 'updated_at' | 'user_id'
> & {
    profiles?: CommunityPost['profiles']
    post_reactions?: Array<{ emoji: string; user_id: string }>
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    return `${days}d atrás`
}

export default function ComunidadePage() {
    const { user } = useAuth()
    const supabase = createBrowserClient()
    const [channels, setChannels] = useState<CommunityChannel[]>([])
    const [activeChannel, setActiveChannel] = useState<string | null>(null)
    const [posts, setPosts] = useState<PostFeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [composerOpen, setComposerOpen] = useState(false)
    const [postContent, setPostContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPosts = useCallback(async (channelId: string) => {
        const { data } = await supabase
            .from('community_posts')
            .select('id, channel_id, conteudo, reacoes, total_comentarios, pinned, status, created_at, updated_at, user_id, profiles(display_name, username, avatar_url), post_reactions(emoji, user_id)')
            .eq('channel_id', channelId)
            .eq('status', 'ativo')
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(20)

        return ((data as unknown) as PostFeedItem[]) || []
    }, [supabase])

    useEffect(() => {
        let active = true

        async function loadChannels() {
            const { data } = await supabase
                .from('community_channels')
                .select('id, slug, nome, descricao, icone, cor, ordem, ativo')
                .eq('ativo', true)
                .order('ordem')

            if (!active) return

            const loadedChannels = (data as CommunityChannel[]) || []
            setChannels(loadedChannels)
            setActiveChannel((current) => current ?? loadedChannels[0]?.id ?? null)
            setLoading(false)
        }

        void loadChannels()

        return () => {
            active = false
        }
    }, [supabase])

    useEffect(() => {
        if (!activeChannel) return
        const channelId = activeChannel

        let active = true

        async function loadPosts() {
            const loadedPosts = await fetchPosts(channelId)
            if (!active) return
            setPosts(loadedPosts)
        }

        void loadPosts()

        return () => {
            active = false
        }
    }, [activeChannel, fetchPosts])

    const handleCreatePost = async () => {
        if (!user || !activeChannel || !postContent.trim()) return

        setSubmitting(true)
        setError(null)

        const { error: insertError } = await supabase.from('community_posts').insert({
            user_id: user.id,
            channel_id: activeChannel,
            conteudo: postContent.trim(),
        })

        setSubmitting(false)

        if (insertError) {
            setError(insertError.message)
            return
        }

        setPostContent('')
        setComposerOpen(false)
        const loadedPosts = await fetchPosts(activeChannel)
        setPosts(loadedPosts)
    }

    const toggleReaction = async (postId: string, emoji: string, reacted: boolean) => {
        if (!user || !activeChannel) return

        if (reacted) {
            await supabase
                .from('post_reactions')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .eq('emoji', emoji)
        } else {
            await supabase.from('post_reactions').insert({
                post_id: postId,
                user_id: user.id,
                emoji,
            })
        }

        const loadedPosts = await fetchPosts(activeChannel)
        setPosts(loadedPosts)
    }

    if (loading) {
        return (
            <>
                <TopBar title="Comunidade" />
                <div className="px-4 py-5 space-y-3">
                    <Skeleton className="h-10 w-full rounded-full" />
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
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
                        aria-label="Criar post"
                        onClick={() => setComposerOpen(true)}
                    >
                        <Plus className="h-5 w-5 text-white" />
                    </Button>
                }
            />

            <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo post</DialogTitle>
                        <DialogDescription>
                            Compartilhe uma descoberta, duvida ou recomendacao com a comunidade.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={postContent}
                        onChange={(event) => setPostContent(event.target.value)}
                        className="min-h-32"
                        placeholder="Escreva seu post..."
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setComposerOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreatePost}
                            disabled={!postContent.trim() || submitting}
                            className="bg-[var(--color-coreduca-blue)] text-white"
                        >
                            {submitting ? 'Publicando...' : 'Publicar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="py-3">
                <ScrollArea className="w-full">
                    <div className="flex gap-2 px-4 pb-3">
                        {channels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${activeChannel === channel.id
                                    ? 'bg-[var(--color-coreduca-blue)] text-white shadow-md shadow-[var(--color-coreduca-blue)]/25'
                                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                <span>{channel.icone}</span>
                                {channel.nome}
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <div className="px-4 space-y-4 mt-2">
                    {posts.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p className="text-lg">🌱</p>
                                <p className="text-sm mt-2">Nenhum post neste canal ainda. Seja a primeira!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        posts.map((post, index) => {
                            const profile = post.profiles
                            const initials = (profile?.display_name || profile?.username || 'U')
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
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                >
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-4">
                                            <Link href={`/comunidade/post/${post.id}`} className="block">
                                                <div className="mb-3 flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] text-xs font-bold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold">{profile?.display_name || profile?.username}</p>
                                                        <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm leading-relaxed">{post.conteudo}</p>
                                            </Link>
                                            <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
                                                <div className="flex items-center gap-1">
                                                    {communityReactionEmojis.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction(post.id, emoji, userReactions.has(emoji))}
                                                            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-xs transition-colors ${userReactions.has(emoji)
                                                                ? 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]'
                                                                : 'bg-secondary hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span className="font-semibold text-muted-foreground">{post.reacoes?.[emoji] ?? 0}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <Link href={`/comunidade/post/${post.id}`} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    <span className="font-semibold">{post.total_comentarios}</span>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}
