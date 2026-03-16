'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import type { NivelCoreduca } from '@/types/database'

const interesses = [
    { id: 'doramas', label: 'Doramas', emoji: '🎬' },
    { id: 'kpop', label: 'K-pop', emoji: '🎵' },
    { id: 'viagem', label: 'Viajar para Coreia', emoji: '✈️' },
    { id: 'conversacao', label: 'Conversação', emoji: '💬' },
    { id: 'tudo', label: 'Tudo acima!', emoji: '✨' },
]

const niveis = [
    { id: 'exploradora', label: 'Zero / Curiosa', desc: 'Nunca estudei coreano' },
    { id: 'primeiros_passos', label: 'Sei algumas palavras', desc: 'Comecei a aprender recentemente' },
    { id: 'sobrevivencia', label: 'Entendo um pouco', desc: 'Consigo frases básicas' },
] as const satisfies Array<{ id: NivelCoreduca; label: string; desc: string }>

export default function OnboardingPage() {
    const router = useRouter()
    const { user, refreshProfile } = useAuth()
    const supabase = createBrowserClient()
    const [step, setStep] = useState(0)
    const [interesse, setInteresse] = useState<string | null>(null)
    const [dorama, setDorama] = useState('')
    const [nivel, setNivel] = useState<NivelCoreduca | null>(null)
    const [loading, setLoading] = useState(false)

    const totalSteps = 5
    const progress = ((step + 1) / totalSteps) * 100

    const handleComplete = async () => {
        if (!user) return
        setLoading(true)

        // Update profile with onboarding answers
        await supabase.from('profiles').update({
            interesse_principal: interesse,
            dorama_favorito: dorama || null,
            nivel_atual: nivel || 'exploradora',
            updated_at: new Date().toISOString(),
        }).eq('id', user.id)

        // Save onboarding completion
        await supabase.from('onboarding_completions').upsert({
            user_id: user.id,
            respostas: { interesse, dorama, nivel },
            completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        await refreshProfile()
        router.push('/home')
    }

    const slides = [
        // Step 0: Welcome
        <div key="welcome" className="text-center flex flex-col items-center">
            <div className="mb-8 mt-4 flex justify-center w-full">
                <Logo className="h-10" />
            </div>
            <h1 className="text-3xl font-extrabold">Bem-vinda ao Coreduca!</h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Vamos personalizar sua experiência para que o aprendizado seja ainda mais incrível 💜
            </p>
        </div>,

        // Step 1: Interest
        <div key="interest" className="text-center">
            <h2 className="text-xl font-extrabold mb-2">O que te trouxe aqui?</h2>
            <p className="text-sm text-muted-foreground mb-6">Escolha o que mais te motiva</p>
            <div className="space-y-3">
                {interesses.map((i) => (
                    <button
                        key={i.id}
                        onClick={() => setInteresse(i.id)}
                        className={`w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all ${interesse === i.id
                            ? 'bg-[var(--color-coreduca-blue)]/10 ring-2 ring-[var(--color-coreduca-blue)] shadow-md'
                            : 'bg-secondary hover:bg-secondary/80'
                            }`}
                    >
                        <span className="text-2xl">{i.emoji}</span>
                        <span className="font-bold text-sm">{i.label}</span>
                    </button>
                ))}
            </div>
        </div>,

        // Step 2: Dorama
        <div key="dorama" className="text-center">
            <span className="text-5xl block mb-4">🎬</span>
            <h2 className="text-xl font-extrabold mb-2">Qual seu dorama favorito?</h2>
            <p className="text-sm text-muted-foreground mb-6">Pode pular se quiser 😊</p>
            <input
                type="text"
                placeholder="Ex: Crash Landing on You, Reply 1988..."
                value={dorama}
                onChange={(e) => setDorama(e.target.value)}
                className="w-full p-4 rounded-2xl bg-secondary text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-coreduca-blue)]/30"
            />
        </div>,

        // Step 3: Level
        <div key="level" className="text-center">
            <h2 className="text-xl font-extrabold mb-2">Qual seu nível?</h2>
            <p className="text-sm text-muted-foreground mb-6">Sem julgamento, estamos aqui pra ajudar!</p>
            <div className="space-y-3">
                {niveis.map((n) => (
                    <button
                        key={n.id}
                        onClick={() => setNivel(n.id)}
                        className={`w-full p-4 rounded-2xl text-left transition-all ${nivel === n.id
                            ? 'bg-[var(--color-coreduca-blue)]/10 ring-2 ring-[var(--color-coreduca-blue)] shadow-md'
                            : 'bg-secondary hover:bg-secondary/80'
                            }`}
                    >
                        <p className="font-bold text-sm">{n.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                    </button>
                ))}
            </div>
        </div>,

        // Step 4: Ready
        <div key="ready" className="text-center">
            <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-7xl block mb-6"
            >
                🎉
            </motion.span>
            <h2 className="text-2xl font-extrabold">Tudo pronto!</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Sua jornada no coreano começa agora. Vamos aprender juntas? 💜
            </p>
        </div>,
    ]

    const canAdvance = () => {
        if (step === 1 && !interesse) return false
        if (step === 3 && !nivel) return false
        return true
    }

    return (
        <div className="min-h-screen bg-background flex flex-col p-6 max-w-md mx-auto">
            {/* Progress bar */}
            <div className="mb-8">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                    {step + 1} de {totalSteps}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {slides[step]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
                {step > 0 && (
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-xl"
                        onClick={() => setStep((s) => s - 1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                )}

                {step < totalSteps - 1 ? (
                    <Button
                        className="flex-1 h-12 rounded-xl bg-[var(--color-coreduca-blue)] text-white font-bold"
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canAdvance()}
                    >
                        Continuar <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                ) : (
                    <Button
                        className="flex-1 h-12 rounded-xl bg-[var(--color-coreduca-blue)] text-white font-bold"
                        onClick={handleComplete}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Começar! 🚀'}
                    </Button>
                )}
            </div>
        </div>
    )
}
