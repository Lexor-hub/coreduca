'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Questao } from '@/types/database'

interface MiniLicaoProps {
    questoes: Questao[]
    onComecar: () => void
}

type VocabItem = {
    coreano: string
    romanizacao: string | null
    significado: string
}

function extrairVocabulario(questoes: Questao[]): VocabItem[] {
    const seen = new Set<string>()
    const items: VocabItem[] = []

    for (const q of questoes) {
        if (!q.enunciado_coreano) continue
        if (q.tipo === 'verdadeiro_falso') continue

        const raw = q.enunciado_coreano
        // Extract Korean text (before parentheses)
        const coreano = raw.replace(/\s*\(.*?\)\s*$/, '').trim()
        if (seen.has(coreano)) continue
        seen.add(coreano)

        // Extract romanization from parentheses
        const romanMatch = raw.match(/\(([^)]+)\)\s*$/)
        const romanizacao = romanMatch ? romanMatch[1] : null

        items.push({
            coreano,
            romanizacao,
            significado: q.resposta_correta,
        })
    }

    return items.slice(0, 10) // Cap at 10 cards
}

export function MiniLicao({ questoes, onComecar }: MiniLicaoProps) {
    const vocab = extrairVocabulario(questoes)
    const [index, setIndex] = useState(0)

    if (vocab.length === 0) {
        // No vocab to show, go straight to quiz
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-6">
                <BookOpen className="h-12 w-12 text-[var(--color-coreduca-blue)]" />
                <p className="text-muted-foreground">Vamos comecar o quiz!</p>
                <Button onClick={onComecar} className="rounded-full px-8">
                    Comecar Quiz
                </Button>
            </div>
        )
    }

    const item = vocab[index]

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-[var(--color-coreduca-blue)]" />
                    <p className="text-sm font-bold text-[var(--color-coreduca-blue)]">Mini-licao</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    Estude o vocabulario antes de comecar
                </p>
            </div>

            <div className="w-full relative min-h-[200px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl border-2 border-[var(--color-coreduca-blue)]/20 shadow-lg p-8 text-center space-y-4"
                    >
                        <p className="text-4xl font-black text-[var(--color-coreduca-blue)] tracking-wide">
                            {item.coreano}
                        </p>
                        {item.romanizacao && (
                            <p className="text-sm text-muted-foreground">
                                ({item.romanizacao})
                            </p>
                        )}
                        <div className="h-px bg-border w-16 mx-auto" />
                        <p className="text-lg font-semibold text-foreground">
                            {item.significado}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIndex(Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="p-2 rounded-full bg-secondary disabled:opacity-30"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex gap-1.5">
                    {vocab.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                i === index
                                    ? 'bg-[var(--color-coreduca-blue)] w-4'
                                    : 'bg-muted-foreground/30'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => setIndex(Math.min(vocab.length - 1, index + 1))}
                    disabled={index === vocab.length - 1}
                    className="p-2 rounded-full bg-secondary disabled:opacity-30"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            <Button
                onClick={onComecar}
                className="rounded-full px-8 w-full max-w-xs"
            >
                Comecar Quiz
            </Button>
        </div>
    )
}
