'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { use } from 'react'
import type { AIMessage, AIPersona } from '@/types/database'
import { personaEmojiMap, personaGradientMap, isPremium as checkPremium } from '@/lib/coreduca'

type Message = Pick<AIMessage, 'content'> & { role: 'user' | 'assistant' }
type PersonaChat = Pick<
    AIPersona,
    'id' | 'slug' | 'nome' | 'cor_tema' | 'energia_maxima_free' | 'energia_maxima_premium' | 'system_prompt'
>

export default function ChatPersonaPage({ params }: { params: Promise<{ personaId: string }> }) {
    const { personaId } = use(params)
    const router = useRouter()
    const { user, profile } = useAuth()
    const supabase = createBrowserClient()

    const [persona, setPersona] = useState<PersonaChat | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [energyUsed, setEnergyUsed] = useState(0)
    const [pageLoading, setPageLoading] = useState(true)
    const [chatError, setChatError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isPremium = checkPremium(profile?.plano)
    const maxEnergy = persona ? (isPremium ? persona.energia_maxima_premium : persona.energia_maxima_free) : 5

    useEffect(() => {
        async function fetchData() {
            // Fetch persona
            const { data: personaData } = await supabase
                .from('ai_personas')
                .select('id, slug, nome, cor_tema, energia_maxima_free, energia_maxima_premium, system_prompt')
                .eq('slug', personaId)
                .single()

            if (personaData) setPersona(personaData)

            // Fetch today's session
            if (user && personaData) {
                const today = new Date().toISOString().split('T')[0]
                const { data: session } = await supabase
                    .from('ai_sessions')
                    .select('mensagens, energia_usada')
                    .eq('user_id', user.id)
                    .eq('persona_id', personaData.id)
                    .eq('data', today)
                    .maybeSingle()

                if (session) {
                    setMessages(session.mensagens as Message[] || [])
                    setEnergyUsed(session.energia_usada)
                } else {
                    // Generate opening message based on persona
                    const openingMessages: Record<string, string> = {
                        soo: '안녕하세요! 😊 Olá! Eu sou a Soo, sua guia de coreano no Coreduca.\n\nVamos começar com algo simples: como dizer "Olá" em coreano?\n\nA forma mais usada é **안녕하세요** (annyeonghaseyo). Repita comigo! 🌸',
                        jiwoo: '안녕! 🤗 Oi! Eu sou a Jiwoo e adoro conversar!\n\nQue tal a gente praticar juntas? Vou começar com algo fácil! Tente me responder em coreano, OK? 😊\n\n**저는 지우예요** (jeoneun Jiwoo-yeyo) = Eu sou a Jiwoo!\n\nAgora sua vez — **저는 ___예요** (jeoneun ___-yeyo). Coloque seu nome!',
                        hana: 'Oi, gataaaa! 💃 Eu sou a Hana e vou te ensinar o coreano REAL!\n\nEsquece aquele coreano de livro — aqui a gente fala como os coreanos falam de verdade! 🔥\n\nVou começar com a gíria mais usada da Coreia toda: **대박** (daebak) = nossa/caramba/wow!\n\nUsa quando algo te surpreende! Ex: viu um dorama incrível? DAEBAK! 🤯',
                    }
                    setMessages([{ role: 'assistant', content: openingMessages[personaId] || openingMessages.soo }])
                }
            }

            setPageLoading(false)
        }
        fetchData()
    }, [supabase, user, personaId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading || energyUsed >= maxEnergy || !persona) return
        const userMessage = input.trim()
        setInput('')
        setChatError(null)

        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
        setMessages(newMessages)
        setLoading(true)

        try {
            const response = await fetch('/api/ia/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona_id: persona.id,
                    mensagem: userMessage,
                    historico: messages,
                }),
            })
            const payload = await response.json()

            if (!response.ok) {
                setMessages(messages)
                if (response.status === 429) {
                    setEnergyUsed((payload.energia_usada as number | undefined) ?? energyUsed)
                }
                throw new Error(payload.error || 'Nao foi possivel enviar sua mensagem.')
            }

            const assistantMsg: Message = { role: 'assistant', content: payload.resposta as string }
            const finalMessages = [...newMessages, assistantMsg]
            setMessages(finalMessages)
            setEnergyUsed((payload.energia_usada as number | undefined) ?? energyUsed + 1)
        } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Erro ao enviar mensagem.')
        } finally {
            setLoading(false)
        }
    }

    const emoji = personaEmojiMap[personaId] || '🤖'
    const gradient = personaGradientMap[personaId] || 'from-blue-400 to-blue-600'

    if (pageLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="p-4 border-b">
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-20 w-3/4" />
                    <Skeleton className="h-12 w-1/2 ml-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50 px-4 py-3 safe-area-top">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()} aria-label="Voltar">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                        <span className="text-lg">{emoji}</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm">{persona?.nome || personaId}</p>
                        <p className="text-[10px] text-muted-foreground">Online agora</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full">
                        <Zap className="h-3.5 w-3.5 text-[var(--color-coreduca-yellow)]" />
                        <span className="text-xs font-bold">{energyUsed}/{maxEnergy}</span>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm mt-1`}>
                                <span className="text-sm">{emoji}</span>
                            </div>
                        )}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-[var(--color-coreduca-blue)] text-white rounded-br-md'
                                : 'bg-secondary rounded-bl-md'
                            }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-sm">{emoji}</span>
                        </div>
                        <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
                {chatError && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {chatError}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 bg-white/90 backdrop-blur-xl px-4 py-3 safe-area-bottom">
                <div className="max-w-lg mx-auto flex items-center gap-2">
                    {energyUsed >= maxEnergy ? (
                        <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
                            ⚡ Energia esgotada para hoje
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="Escreva sua mensagem..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 h-11 px-4 rounded-full bg-secondary text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-coreduca-blue)]/30"
                                disabled={loading}
                            />
                            <Button
                                size="icon"
                                className="h-11 w-11 rounded-full bg-[var(--color-coreduca-blue)] hover:bg-[var(--color-coreduca-blue)]/90 shadow-md"
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                aria-label="Enviar mensagem"
                            >
                                <Send className="h-5 w-5 text-white" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
