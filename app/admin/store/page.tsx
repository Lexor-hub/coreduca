'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, ShoppingBag, BarChart3, TrendingUp, Users } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

type ClickStat = {
    item_id: string
    count: number
    last_click: string
}

export default function AdminStorePage() {
    const supabase = createBrowserClient()
    const [items, setItems] = useState<EditableStoreItem[]>([])
    const [selectedItem, setSelectedItem] = useState<EditableStoreItem>(emptyItem())
    const [stats, setStats] = useState<ClickStat[]>([])
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'editor' | 'radar'>('editor')

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            setError(null)

            // Load Items
            const { data: itemsData, error: loadError } = await supabase.from('store_items').select('*').order('ordem')
            if (loadError) {
                setError('Nao foi possivel carregar os itens da store.')
            } else {
                setItems((itemsData as EditableStoreItem[]) || [])
                if (itemsData && itemsData.length > 0) setSelectedItem(itemsData[0])
            }

            // Load Clicks (Admin only policy applies)
            const { data: clicksData, error: clicksError } = await supabase
                .from('store_clicks' as any)
                .select('item_id, created_at')
            
            if (!clicksError && clicksData) {
                const clickMap: Record<string, { count: number, last_click: string }> = {}
                ;(clicksData as any[]).forEach((click) => {
                    const id = click.item_id
                    if (!clickMap[id]) {
                        clickMap[id] = { count: 0, last_click: click.created_at }
                    }
                    clickMap[id].count += 1
                    if (new Date(click.created_at) > new Date(clickMap[id].last_click)) {
                        clickMap[id].last_click = click.created_at
                    }
                })
                
                const statsArray = Object.keys(clickMap).map(id => ({
                    item_id: id,
                    count: clickMap[id].count,
                    last_click: clickMap[id].last_click
                })).sort((a, b) => b.count - a.count)

                setStats(statsArray)
            }

            setLoading(false)
        }

        void loadData()
    }, [supabase])

    const handleSave = async () => {
        if (!selectedItem.titulo.trim()) {
            setError('Informe pelo menos o titulo do item antes de salvar.')
            return
        }

        setSaving(true)
        setError(null)
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

        const { data, error: reloadError } = await supabase.from('store_items').select('*').order('ordem')
        if (reloadError) {
            setError('O item foi salvo, mas a lista nao pode ser atualizada agora.')
        }
        setItems((data as EditableStoreItem[]) || [])
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-[var(--color-coreduca-blue)]" />
                    <h1 className="text-xl font-bold">Gestão da Store</h1>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('editor')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'editor' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Editor de Produtos
                    </button>
                    <button
                        onClick={() => setViewMode('radar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'radar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp className="h-4 w-4" /> Radar de Interesse
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Carregando dados...</div>
            ) : viewMode === 'editor' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <Card className="border-slate-200 shadow-sm lg:col-span-4 h-fit">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm">Catálogo</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => setSelectedItem(emptyItem())} className="h-8">
                                <Plus className="mr-2 h-3 w-3" /> Novo
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                            {error && (
                                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                            )}
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${selectedItem.id === item.id ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5 ring-1 ring-[var(--color-coreduca-blue)]/20' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <p className="text-sm font-bold truncate text-slate-800">{item.titulo}</p>
                                    <p className="text-xs text-slate-500 font-medium">R$ {Number(item.preco || 0).toFixed(2)}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm lg:col-span-8 h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">Detalhes do Produto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">Título do Produto</Label>
                                    <Input value={selectedItem.titulo} onChange={(event) => setSelectedItem((current) => ({ ...current, titulo: event.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">Preço (R$)</Label>
                                    <Input type="number" value={selectedItem.preco || 0} onChange={(event) => setSelectedItem((current) => ({ ...current, preco: Number(event.target.value) || 0 }))} className="bg-slate-50" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <Label className="text-slate-600">Descrição (Visível na loja)</Label>
                                <Textarea value={selectedItem.descricao || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, descricao: event.target.value }))} className="bg-slate-50 resize-y min-h-[100px]" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">Categoria (Tipo)</Label>
                                    <select
                                        value={selectedItem.tipo || 'produto'}
                                        onChange={(event) => setSelectedItem((current) => ({ ...current, tipo: event.target.value as StoreItem['tipo'] }))}
                                        className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="colecionador">Itens de colecionadoras(o)</option>
                                        <option value="vestuario">Vestuário</option>
                                        <option value="skincare">Skincare</option>
                                        <option value="alimento">Comidas / Bebidas</option>
                                        <option value="album">Figurinhas / Álbuns</option>
                                        <option value="produto">Outros (Produto Geral)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">Ordem de Exibição</Label>
                                    <Input type="number" value={selectedItem.ordem || 1} onChange={(event) => setSelectedItem((current) => ({ ...current, ordem: Number(event.target.value) || 1 }))} className="bg-slate-50" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-slate-600">URL da Imagem (Capa do Produto)</Label>
                                <Input placeholder="https://unsplash.com/..." value={selectedItem.imagem_url || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, imagem_url: event.target.value }))} className="bg-slate-50" />
                                <p className="text-[10px] text-slate-400">Insira um link direto de imagem. Se vazio, uma imagem coreana de placeholder será usada.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-slate-600">Link Externo (Desativado no Mini E-commerce simulado)</Label>
                                <Input value={selectedItem.link_externo || ''} onChange={(event) => setSelectedItem((current) => ({ ...current, link_externo: event.target.value }))} className="bg-slate-50 disabled:opacity-50" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                                <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Ativo na Loja</p>
                                        <p className="text-[11px] text-slate-500">Ocultar ou mostrar este item.</p>
                                    </div>
                                    <Switch checked={selectedItem.ativo} onCheckedChange={(checked) => setSelectedItem((current) => ({ ...current, ativo: checked }))} />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border bg-indigo-50/50 px-4 py-3 border-indigo-100">
                                    <div>
                                        <p className="text-sm font-bold text-indigo-900">Destaque (Hype)</p>
                                        <p className="text-[11px] text-indigo-600/70">Aplica efeitos visuais no card.</p>
                                    </div>
                                    <Switch checked={selectedItem.destaque} onCheckedChange={(checked) => setSelectedItem((current) => ({ ...current, destaque: checked }))} />
                                </div>
                            </div>
                            
                            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto h-11 bg-[var(--color-coreduca-blue)] hover:bg-[var(--color-coreduca-blue)]/90 text-white font-bold rounded-xl mt-4">
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Salvando Alterações...' : (selectedItem.id ? 'Atualizar Produto' : 'Cadastrar novo Produto')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b pb-6">
                        <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Radar de Interesse (Cliques em 'Comprar')
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 mt-1">
                            Acompanhe quais produtos e eventos (como ingressos) estão gerando mais intenção de compra pelos alunos, com base nos cliques de "Sem Estoque".
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {stats.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                                <p className="font-semibold text-slate-500 text-sm">Ainda não há dados de clique.</p>
                                <p className="text-xs mt-1">Os interesses aparecerão aqui assim que as alunas tentarem comprar itens na loja.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stats.map((stat, index) => {
                                    const product = items.find(i => i.id === stat.item_id)
                                    return (
                                        <div key={stat.item_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                                        {product ? product.titulo : 'Produto Deletado'}
                                                        {index === 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-[10px] px-2 py-0">🏆 Mais Desejado</Badge>}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Último interesse registrado em: {new Date(stat.last_click).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100/50 ml-14 sm:ml-0">
                                                <Users className="h-4 w-4 text-indigo-400" />
                                                <span className="font-black text-indigo-600 text-lg">{stat.count}</span>
                                                <span className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wide">Cliques</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
