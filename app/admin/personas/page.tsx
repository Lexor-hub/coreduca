'use client'

import { useEffect, useState } from 'react'
import { Bot, Plus, Save } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AIPersona } from '@/types/database'

type EditablePersona = AIPersona

function emptyPersona(): EditablePersona {
    return {
        id: '',
        slug: '',
        nome: '',
        avatar_url: '',
        descricao: '',
        foco: '',
        tom: '',
        system_prompt: '',
        nivel_minimo: 'exploradora',
        energia_maxima_free: 5,
        energia_maxima_premium: 30,
        cor_tema: '#5B7CFA',
        ativo: true,
        ordem: 1,
    }
}

export default function AdminPersonasPage() {
    const supabase = createBrowserClient()
    const [personas, setPersonas] = useState<EditablePersona[]>([])
    const [selectedPersona, setSelectedPersona] = useState<EditablePersona>(emptyPersona())
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadPersonas() {
            setError(null)
            const { data, error: loadError } = await supabase.from('ai_personas').select('*').order('ordem')
            const loaded = (data as EditablePersona[]) || []
            if (loadError) {
                setError('Nao foi possivel carregar as personas agora.')
                setPersonas([])
            } else {
                setPersonas(loaded)
                if (loaded.length > 0) setSelectedPersona(loaded[0])
            }
            setLoading(false)
        }

        void loadPersonas()
    }, [supabase])

    const handleSave = async () => {
        if (!selectedPersona.slug.trim() || !selectedPersona.nome.trim() || !selectedPersona.system_prompt.trim()) {
            setError('Slug, nome e system prompt sao obrigatorios.')
            return
        }

        setSaving(true)
        setError(null)
        const payload = {
            slug: selectedPersona.slug,
            nome: selectedPersona.nome,
            avatar_url: selectedPersona.avatar_url || null,
            descricao: selectedPersona.descricao || null,
            foco: selectedPersona.foco || null,
            tom: selectedPersona.tom || null,
            system_prompt: selectedPersona.system_prompt,
            nivel_minimo: selectedPersona.nivel_minimo || 'exploradora',
            energia_maxima_free: selectedPersona.energia_maxima_free,
            energia_maxima_premium: selectedPersona.energia_maxima_premium,
            cor_tema: selectedPersona.cor_tema || null,
            ativo: selectedPersona.ativo,
            ordem: selectedPersona.ordem || 1,
        }

        if (selectedPersona.id) {
            await supabase.from('ai_personas').update(payload).eq('id', selectedPersona.id)
        } else {
            const { data } = await supabase.from('ai_personas').insert(payload).select().single()
            if (data) setSelectedPersona(data as EditablePersona)
        }

        const { data, error: reloadError } = await supabase.from('ai_personas').select('*').order('ordem')
        if (reloadError) {
            setError('A persona foi salva, mas a lista nao pode ser atualizada agora.')
        }
        setPersonas((data as EditablePersona[]) || [])
        setSaving(false)
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="border-0 shadow-sm lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-[var(--color-coreduca-blue)]" />
                        Personas
                    </CardTitle>
                    <Button variant="outline" onClick={() => setSelectedPersona(emptyPersona())}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>
                    )}
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : personas.map((persona) => (
                        <button
                            key={persona.id}
                            onClick={() => setSelectedPersona(persona)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedPersona.id === persona.id ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5' : 'border-border/60'
                                }`}
                        >
                            <p className="text-sm font-bold">{persona.nome}</p>
                            <p className="text-xs text-muted-foreground">{persona.foco}</p>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-8">
                <CardHeader>
                    <CardTitle>Editor da persona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={selectedPersona.slug} onChange={(event) => setSelectedPersona((current) => ({ ...current, slug: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={selectedPersona.nome} onChange={(event) => setSelectedPersona((current) => ({ ...current, nome: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea value={selectedPersona.descricao || ''} onChange={(event) => setSelectedPersona((current) => ({ ...current, descricao: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Foco</Label>
                            <Textarea value={selectedPersona.foco || ''} onChange={(event) => setSelectedPersona((current) => ({ ...current, foco: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Energia free</Label>
                            <Input type="number" value={selectedPersona.energia_maxima_free} onChange={(event) => setSelectedPersona((current) => ({ ...current, energia_maxima_free: Number(event.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Energia premium</Label>
                            <Input type="number" value={selectedPersona.energia_maxima_premium} onChange={(event) => setSelectedPersona((current) => ({ ...current, energia_maxima_premium: Number(event.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <Input value={selectedPersona.cor_tema || ''} onChange={(event) => setSelectedPersona((current) => ({ ...current, cor_tema: event.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>System prompt</Label>
                        <Textarea className="min-h-56" value={selectedPersona.system_prompt} onChange={(event) => setSelectedPersona((current) => ({ ...current, system_prompt: event.target.value }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold">Persona ativa</p>
                            <p className="text-xs text-muted-foreground">Disponível para as alunas.</p>
                        </div>
                        <Switch checked={selectedPersona.ativo} onCheckedChange={(checked) => setSelectedPersona((current) => ({ ...current, ativo: checked }))} />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-[var(--color-coreduca-blue)] text-white">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Salvando...' : 'Salvar persona'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
