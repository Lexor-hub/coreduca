'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ModerationPost = {
    id: string
    conteudo: string
    status: 'ativo' | 'moderado' | 'removido'
    pinned: boolean
    created_at: string
    profiles?: { display_name: string | null; username: string }
}

type ReportRow = {
    id: string
    motivo: string | null
    status: 'aberto' | 'revisado' | 'resolvido'
    created_at: string
    post_id: string
}

export default function AdminComunidadePage() {
    const supabase = createBrowserClient()
    const [posts, setPosts] = useState<ModerationPost[]>([])
    const [reports, setReports] = useState<ReportRow[]>([])

    useEffect(() => {
        async function loadData() {
            const [{ data: postsData }, { data: reportsData }] = await Promise.all([
                supabase
                    .from('community_posts')
                    .select('id, conteudo, status, pinned, created_at, profiles(display_name, username)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('post_reports')
                    .select('id, motivo, status, created_at, post_id')
                    .order('created_at', { ascending: false }),
            ])

            setPosts(((postsData as unknown) as ModerationPost[]) || [])
            setReports((reportsData as ReportRow[]) || [])
        }

        void loadData()
    }, [supabase])

    const updatePost = async (postId: string, payload: Partial<ModerationPost>) => {
        await supabase.from('community_posts').update(payload).eq('id', postId)
        setPosts((current) => current.map((post) => post.id === postId ? { ...post, ...payload } : post))
    }

    const updateReport = async (reportId: string, status: ReportRow['status']) => {
        await supabase.from('post_reports').update({ status }).eq('id', reportId)
        setReports((current) => current.map((report) => report.id === reportId ? { ...report, status } : report))
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[var(--color-coreduca-blue)]" />
                        Moderação de posts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="rounded-3xl border border-border/60 p-4">
                            <p className="text-sm font-bold">{post.profiles?.display_name || post.profiles?.username}</p>
                            <p className="mt-2 text-sm leading-relaxed">{post.conteudo}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button size="sm" variant={post.status === 'ativo' ? 'default' : 'outline'} onClick={() => updatePost(post.id, { status: 'ativo' })}>
                                    Ativo
                                </Button>
                                <Button size="sm" variant={post.status === 'moderado' ? 'default' : 'outline'} onClick={() => updatePost(post.id, { status: 'moderado' })}>
                                    Moderado
                                </Button>
                                <Button size="sm" variant={post.status === 'removido' ? 'destructive' : 'outline'} onClick={() => updatePost(post.id, { status: 'removido' })}>
                                    Removido
                                </Button>
                                <Button size="sm" variant={post.pinned ? 'default' : 'outline'} onClick={() => updatePost(post.id, { pinned: !post.pinned })}>
                                    {post.pinned ? 'Desfixar' : 'Fixar'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Denúncias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {reports.map((report) => (
                        <div key={report.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold">Post {report.post_id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">{report.motivo || 'Sem motivo informado.'}</p>
                            </div>
                            <select
                                value={report.status}
                                onChange={(event) => updateReport(report.id, event.target.value as ReportRow['status'])}
                                className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm"
                            >
                                <option value="aberto">Aberto</option>
                                <option value="revisado">Revisado</option>
                                <option value="resolvido">Resolvido</option>
                            </select>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
