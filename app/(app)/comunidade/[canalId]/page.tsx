'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { createBrowserClient } from '@/lib/supabase/client'
import type { CommunityChannel, CommunityPost } from '@/types/database'

type CanalResumo = Pick<CommunityChannel, 'id' | 'slug' | 'nome' | 'descricao' | 'icone' | 'cor' | 'ativo'>
type PostCanal = Pick<
    CommunityPost,
    'id' | 'conteudo' | 'reacoes' | 'total_comentarios' | 'pinned' | 'status' | 'created_at' | 'updated_at' | 'user_id'
> & {
    profiles?: CommunityPost['profiles']
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    return `${days}d atrás`
}

export default function CanalPage({ params }: { params: Promise<{ canalId: string }> }) {
    const { canalId } = use(params)
    const supabase = createBrowserClient()
    const [channel, setChannel] = useState<CanalResumo | null>(null)
    const [posts, setPosts] = useState<PostCanal[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadChannel() {
            const [{ data: channelData }, { data: postsData }] = await Promise.all([
                supabase
                    .from('community_channels')
                    .select('id, slug, nome, descricao, icone, cor, ativo')
                    .eq('id', canalId)
                    .single(),
                supabase
                    .from('community_posts')
                    .select('id, conteudo, reacoes, total_comentarios, pinned, status, created_at, updated_at, user_id, profiles(display_name, username, avatar_url)')
                    .eq('channel_id', canalId)
                    .eq('status', 'ativo')
                    .order('pinned', { ascending: false })
                    .order('created_at', { ascending: false }),
            ])

            setChannel((channelData as CanalResumo | null) ?? null)
            setPosts(((postsData as unknown) as PostCanal[]) || [])
            setLoading(false)
        }

        void loadChannel()
    }, [canalId, supabase])

    if (loading) {
        return (
            <>
                <TopBar title="Canal" showBack />
                <div className="px-4 py-5 space-y-4">
                    <Skeleton className="h-24 rounded-3xl" />
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-3xl" />)}
                </div>
            </>
        )
    }

    return (
        <>
            <TopBar title={channel?.nome || 'Canal'} showBack />
            <div className="px-4 py-5">
                {channel && (
                    <Card className="mb-5 border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-3xl">{channel.icone}</p>
                            <h2 className="mt-3 text-xl font-extrabold">{channel.nome}</h2>
                            <p className="mt-2 text-sm text-muted-foreground">{channel.descricao}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={`/comunidade/post/${post.id}`}>
                                <Card className="border-0 shadow-sm transition-all hover:shadow-md">
                                    <CardContent className="p-4">
                                        <p className="text-sm font-bold">{post.profiles?.display_name || post.profiles?.username}</p>
                                        <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                                        <p className="mt-3 text-sm leading-relaxed">{post.conteudo}</p>
                                        <p className="mt-4 text-xs font-semibold text-muted-foreground">
                                            {post.total_comentarios} comentários
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                    {posts.length === 0 && (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center text-sm text-muted-foreground">
                                Nenhum post neste canal ainda.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    )
}
