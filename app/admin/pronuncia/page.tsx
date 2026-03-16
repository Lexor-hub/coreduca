'use client'

import { useEffect, useState } from 'react'
import { Mic, Plus, Save } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { PronunciationItem } from '@/types/database'

type EditablePronunciationItem = PronunciationItem

function emptyItem(): EditablePronunciationItem {
    return {
        id: '',
        frase_coreano: '',
        transliteracao: '',
        traducao: '',
        audio_modelo_url: '',
        dificuldade: 'basico',
        trilha_id: null,
        tags: [],
        ativo: true,
        created_at: new Date().toISOString(),
    }
}

export default function AdminPronunciaPage() {
    const supabase = createBrowserClient()
    const [items, setItems] = useState<EditablePronunciationItem[]>([])
    const [selectedItem, setSelectedItem] = useState<EditablePronunciationItem>(emptyItem())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadItems() {
            setError(null)
            const { data, error: loadError } = await supabase
                .from('pronunciation_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (loadError) {
                setError('Nao foi possivel carregar os itens de pronuncia.')
                setItems([])
            } else {
                setItems((data as EditablePronunciationItem[]) || [])
            }
            setLoading(false)
        }

        void loadItems()
    }, [supabase])

    const handleSave = async () => {
        if (!selectedItem.frase_coreano.trim() || !selectedItem.traducao.trim()) {
            setError('Preencha a frase em coreano e a traducao antes de salvar.')
            return
        }

        setSaving(true)
        setError(null)
        const payload = {
            frase_coreano: selectedItem.frase_coreano,
            transliteracao: selectedItem.transliteracao || null,
            traducao: selectedItem.traducao,
            audio_modelo_url: selectedItem.audio_modelo_url || null,
            dificuldade: selectedItem.dificuldade,
            tags: selectedItem.tags || [],
            ativo: selectedItem.ativo,
        }

        if (selectedItem.id) {
            await supabase.from('pronunciation_items').update(payload).eq('id', selectedItem.id)
        } else {
            const { data } = await supabase.from('pronunciation_items').insert(payload).select().single()
            if (data) setSelectedItem(data as EditablePronunciationItem)
        }

        const { data, error: reloadError } = await supabase.from('pronunciation_items').select('*').order('created_at', { ascending: false })
        if (reloadError) {
            setError('O item foi salvo, mas a lista nao pode ser atualizada agora.')
        }
        setItems((data as EditablePronunciationItem[]) || [])
        setSaving(false)
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="border-0 shadow-sm lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-[var(--color-coreduca-red)]" />
                        Itens de pronúncia
                    </CardTitle>
                    <Button variant="outline" onClick={() => setSelectedItem(emptyItem())}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>
                    )}
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedItem.id === item.id ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5' : 'border-border/60'
                                    }`}
                            >
                                <p className="text-sm font-bold">{item.frase_coreano}</p>
                                <p className="text-xs text-muted-foreground">{item.traducao}</p>
                            </button>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-8">
                <CardHeader>
                    <CardTitle>Editor do item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Frase em coreano</Label>
                            <Input value={selectedItem.frase_coreano} onChange={(event) => setSelectedItem((current) => ({ ...current, frase_coreano: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Transliteração</Label>
                            <Input value={selectedItem.transliteracao || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, transliteracao: event.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Tradução</Label>
                        <Textarea value={selectedItem.traducao} onChange={(event) => setSelectedItem((current) => ({ ...current, traducao: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Dificuldade</Label>
                            <select
                                value={selectedItem.dificuldade}
                                onChange={(event) => setSelectedItem((current) => ({ ...current, dificuldade: event.target.value as PronunciationItem['dificuldade'] }))}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                            >
                                <option value="basico">Básico</option>
                                <option value="intermediario">Intermediário</option>
                                <option value="avancado">Avançado</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>URL do áudio modelo</Label>
                            <Input value={selectedItem.audio_modelo_url || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, audio_modelo_url: event.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <Input
                            value={(selectedItem.tags || []).join(', ')}
                            onChange={(event) => setSelectedItem((current) => ({
                                ...current,
                                tags: event.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                            }))}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold">Item ativo</p>
                            <p className="text-xs text-muted-foreground">Se desligado, não aparece no app.</p>
                        </div>
                        <Switch checked={selectedItem.ativo} onCheckedChange={(checked) => setSelectedItem((current) => ({ ...current, ativo: checked }))} />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-[var(--color-coreduca-blue)] text-white">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Salvando...' : 'Salvar item'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
