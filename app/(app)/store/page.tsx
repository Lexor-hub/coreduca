'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Star, Package, Frown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { AnimatePresence } from 'framer-motion'

type StoreItem = {
    id: string
    titulo: string
    descricao: string | null
    tipo: string | null
    preco: number | null
    link_externo: string | null
    destaque: boolean
    imagem_url: string | null
}

const categoryMap: Record<string, string> = {
    colecionador: 'Itens de colecionadoras(o)',
    vestuario: 'Vestuário',
    skincare: 'Skincare',
    alimento: 'Comidas / Bebidas',
    album: 'Figurinhas / Álbuns',
    default: 'Outros',
}

const emojiMap: Record<string, string> = {
    colecionador: '💎',
    vestuario: '👕',
    skincare: '🧴',
    alimento: '🍜',
    album: '🎴',
    default: '🛍️',
}

const placeHolderImages: Record<string, string> = {
    colecionador: 'https://images.unsplash.com/photo-1618365908648-e71bd5716cba?q=80&w=600&auto=format&fit=crop',
    vestuario: 'https://images.unsplash.com/photo-1550614000-4b95d4ed7962?q=80&w=600&auto=format&fit=crop',
    skincare: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=600&auto=format&fit=crop',
    alimento: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=600&auto=format&fit=crop',
    album: 'https://images.unsplash.com/photo-1544648710-85f0967db509?q=80&w=600&auto=format&fit=crop',
    default: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600&auto=format&fit=crop',
}

export default function StorePage() {
    const supabase = createBrowserClient()
    const { user } = useAuth()
    const [items, setItems] = useState<StoreItem[]>([])
    const [loading, setLoading] = useState(true)
    const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null)

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase
                .from('store_items')
                .select('id, titulo, descricao, tipo, preco, link_externo, destaque, imagem_url')
                .eq('ativo', true)
                .order('ordem')

            if (data) setItems(data)
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    const handleItemClick = async (item: StoreItem) => {
        // Pop-up amigável indicando 'Sem estoque'
        setToastMessage({
            title: 'Ops! Esgotado 😭',
            desc: 'Mas nós anotamos o seu interesse! Fique de olho na comunidade para novidades.',
        })
        
        setTimeout(() => setToastMessage(null), 4000)

        if (!user) return

        // Grava silenciosamente o interesse
        try {
            // @ts-expect-error Types might not be generated for this new table yet
            await supabase.from('store_clicks').insert({
                item_id: item.id,
                user_id: user.id
            })
        } catch (error) {
            console.error('Failed to log click', error)
        }
    }

    if (loading) {
        return (
            <>
                <TopBar title="Coreduca Store" />
                <div className="px-4 py-5 grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
            </>
        )
    }

    return (
        <>
            <TopBar title="Coreduca Store" />

            <div className="px-4 py-6 space-y-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Merch Oficial</h2>
                        <p className="text-sm text-slate-500 font-medium">Produtos físicos e eventos incríveis ✨</p>
                    </div>
                </motion.div>

                {items.length === 0 ? (
                    <Card className="border-border border-dashed bg-slate-50/50 shadow-none">
                        <CardContent className="p-10 text-center text-slate-400">
                            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-semibold text-slate-500">A vitrine está vazia!</p>
                            <p className="text-xs mt-1">Produtos K-pop e corebook chegando em breve.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-12">
                        {/* Group items by category */}
                        {['colecionador', 'vestuario', 'skincare', 'alimento', 'album', 'default'].map((categoryKey) => {
                            const categoryItems = items.filter(item => {
                                const type = item.tipo || 'default';
                                if (categoryKey === 'default') {
                                    return !['colecionador', 'vestuario', 'skincare', 'alimento', 'album'].includes(type);
                                }
                                return type === categoryKey;
                            });

                            if (categoryItems.length === 0) return null;

                            return (
                                <div key={categoryKey} className="space-y-4">
                                    <h3 className="text-lg font-extrabold flex items-center gap-2 text-slate-800">
                                        <span className="text-2xl">{emojiMap[categoryKey]}</span>
                                        {categoryMap[categoryKey]}
                                    </h3>
                                    
                                    {/* Horizontal Scrolling wrapper for mobile, Grid for desktop */}
                                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 md:snap-none md:overflow-visible gap-4 md:pb-0 md:mx-0 md:px-0 hide-scrollbar">
                                        {categoryItems.map((item, i) => {
                                            const image = item.imagem_url || placeHolderImages[item.tipo || 'default'] || placeHolderImages['default']
                                            const isDestaque = item.destaque

                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                                    onClick={() => handleItemClick(item)}
                                                    className="w-[240px] md:w-auto flex-shrink-0 snap-center"
                                                >
                                                    <div className={`relative flex flex-col h-full rounded-2xl bg-white border cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group ${isDestaque ? 'border-[var(--color-coreduca-blue)]/50 shadow-md ring-2 ring-[var(--color-coreduca-blue)]/10' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                                                        
                                                        {/* Cover Image Area */}
                                                        <div className="relative aspect-[4/3] md:aspect-square w-full overflow-hidden bg-slate-100 flex-shrink-0">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={image}
                                                                alt={item.titulo}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            {/* Badge Overlays */}
                                                            <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                                                                {isDestaque && (
                                                                    <Badge className="bg-gradient-to-r from-[var(--color-coreduca-yellow)] to-amber-500 text-white border-0 shadow-sm text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 animate-pulse-slow">
                                                                        <Star className="h-3 w-3 mr-1 fill-white" />
                                                                        Hype
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Sold Out Overlay (Simulado) */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                                <div className="bg-white/95 text-slate-900 px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                                    <Frown className="h-4 w-4 text-[var(--color-coreduca-red)]" />
                                                                    Esgotado
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content Area */}
                                                        <div className="p-3 flex flex-col flex-1">
                                                            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight flex-1">{item.titulo}</h3>
                                                            
                                                            <div className="mt-3 flex items-end justify-between pt-2 border-t border-slate-100">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Por Apenas</span>
                                                                    <span className="font-black text-lg text-[var(--color-coreduca-blue)] leading-none mt-0.5">
                                                                        <span className="text-xs mr-0.5">R$</span>{Number(item.preco ?? 0).toFixed(2).replace('.', ',')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
                    >
                        <div className="bg-white px-5 py-4 rounded-2xl shadow-xl border border-slate-100 flex items-start gap-4">
                            <div className="h-10 w-10 flex-shrink-0 bg-red-50 rounded-full flex items-center justify-center">
                                <span className="text-xl">😭</span>
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h4 className="font-bold text-slate-800 text-sm">{toastMessage.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toastMessage.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
