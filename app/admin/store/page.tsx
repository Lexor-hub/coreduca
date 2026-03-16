'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, ShoppingBag } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { StoreItem } from '@/types/database'

type EditableStoreItem = StoreItem

function emptyItem(): EditableStoreItem {
    return {
        id: '',
        titulo: '',
        descricao: '',
        tipo: 'produto',
        preco: 0,
        imagem_url: '',
        link_externo: '',
        destaque: false,
        ativo: true,
        data_evento: null,
        ordem: 1,
    }
}

export default function AdminStorePage() {
    const supabase = createBrowserClient()
    const [items, setItems] = useState<EditableStoreItem[]>([])
    const [selectedItem, setSelectedItem] = useState<EditableStoreItem>(emptyItem())
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function loadItems() {
            const { data } = await supabase.from('store_items').select('*').order('ordem')
            const loaded = (data as EditableStoreItem[]) || []
            setItems(loaded)
            if (loaded.length > 0) setSelectedItem(loaded[0])
        }

        void loadItems()
    }, [supabase])

    const handleSave = async () => {
        setSaving(true)
        const payload = {
            titulo: selectedItem.titulo,
            descricao: selectedItem.descricao || null,
            tipo: selectedItem.tipo,
            preco: selectedItem.preco,
            imagem_url: selectedItem.imagem_url || null,
            link_externo: selectedItem.link_externo || null,
            destaque: selectedItem.destaque,
            ativo: selectedItem.ativo,
            data_evento: selectedItem.data_evento,
            ordem: selectedItem.ordem || 1,
        }

        if (selectedItem.id) {
            await supabase.from('store_items').update(payload).eq('id', selectedItem.id)
        } else {
            const { data } = await supabase.from('store_items').insert(payload).select().single()
            if (data) setSelectedItem(data as EditableStoreItem)
        }

        const { data } = await supabase.from('store_items').select('*').order('ordem')
        setItems((data as EditableStoreItem[]) || [])
        setSaving(false)
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="border-0 shadow-sm lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-[var(--color-coreduca-yellow)]" />
                        Itens da store
                    </CardTitle>
                    <Button variant="outline" onClick={() => setSelectedItem(emptyItem())}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedItem.id === item.id ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5' : 'border-border/60'
                                }`}
                        >
                            <p className="text-sm font-bold">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground">R$ {Number(item.preco || 0).toFixed(2)}</p>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-8">
                <CardHeader>
                    <CardTitle>Editor do item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={selectedItem.titulo} onChange={(event) => setSelectedItem((current) => ({ ...current, titulo: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Preço</Label>
                            <Input type="number" value={selectedItem.preco || 0} onChange={(event) => setSelectedItem((current) => ({ ...current, preco: Number(event.target.value) || 0 }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={selectedItem.descricao || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, descricao: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <select
                                value={selectedItem.tipo || 'produto'}
                                onChange={(event) => setSelectedItem((current) => ({ ...current, tipo: event.target.value as StoreItem['tipo'] }))}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                            >
                                <option value="produto">Produto</option>
                                <option value="kit">Kit</option>
                                <option value="workshop">Workshop</option>
                                <option value="evento">Evento</option>
                                <option value="experiencia">Experiência</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ordem</Label>
                            <Input type="number" value={selectedItem.ordem || 1} onChange={(event) => setSelectedItem((current) => ({ ...current, ordem: Number(event.target.value) || 1 }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Link externo</Label>
                        <Input value={selectedItem.link_externo || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, link_externo: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold">Item ativo</p>
                                <p className="text-xs text-muted-foreground">Visível para as alunas.</p>
                            </div>
                            <Switch checked={selectedItem.ativo} onCheckedChange={(checked) => setSelectedItem((current) => ({ ...current, ativo: checked }))} />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold">Destaque na store</p>
                                <p className="text-xs text-muted-foreground">Ganha destaque visual.</p>
                            </div>
                            <Switch checked={selectedItem.destaque} onCheckedChange={(checked) => setSelectedItem((current) => ({ ...current, destaque: checked }))} />
                        </div>
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
