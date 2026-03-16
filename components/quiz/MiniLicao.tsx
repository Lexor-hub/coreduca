'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Questao } from '@/types/database'

interface MiniLicaoProps {
    questoes: Questao[]
    onComecar: () => void
}

type VocabItem = {
    coreano: string
    romanizacao: string | null
    significado: string
    contexto: string
}

function extractQuotedText(text: string) {
    const quotedMatch = text.match(/"([^"]+)"/)
    return quotedMatch?.[1] ?? null
}

function isMostlyHangul(text: string) {
    const cleaned = text.replace(/\s+/g, '')
    if (!cleaned) return false

    const hangulChars = Array.from(cleaned).filter((char) => /[가-힣]/.test(char)).length
    return hangulChars / cleaned.length > 0.5
}

function deriveMeaning(questao: Questao) {
    const quoted = extractQuotedText(questao.enunciado)

    if (questao.tipo === 'coreano_para_portugues') {
        return questao.resposta_correta
    }

    if (questao.tipo === 'portugues_para_coreano' && quoted) {
        return quoted
    }

    if (quoted) {
        return quoted
    }

    if (!isMostlyHangul(questao.resposta_correta)) {
        return questao.resposta_correta
    }

    return questao.enunciado
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
            significado: deriveMeaning(q),
            contexto: q.enunciado,
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
        <div className="flex w-full flex-col items-center gap-6">
            <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(19,32,52,1),rgba(25,92,255,0.92))] text-white shadow-xl">
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">Mini-licao</p>
                            </div>
                            <h2 className="text-2xl font-black leading-tight">Aquecimento antes do quiz</h2>
                            <p className="max-w-xs text-sm text-white/75">
                                Passe pelas palavras-chave da missao e entre no quiz com o ouvido e o vocabulario ativados.
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white/12 p-4 text-center backdrop-blur">
                            <p className="text-3xl font-black">{index + 1}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-white/70">de {vocab.length}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-0 bg-white/12 text-white">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Vocabulario essencial
                        </Badge>
                        <Badge className="border-0 bg-white/12 text-white">
                            Passe rapido antes de responder
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="w-full relative min-h-[280px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5 rounded-[2rem] border border-[var(--color-coreduca-blue)]/15 bg-[linear-gradient(180deg,#ffffff,rgba(235,243,255,0.72))] p-8 text-center shadow-[0_24px_60px_rgba(19,32,52,0.12)]"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <p className="text-4xl font-black text-[var(--color-coreduca-blue)] tracking-wide">
                            {item.coreano}
                        </p>
                        {item.romanizacao && (
                            <p className="text-sm text-muted-foreground">
                                ({item.romanizacao})
                            </p>
                        )}
                        <div className="mx-auto h-px w-16 bg-border" />
                        <p className="text-lg font-semibold text-foreground">
                            {item.significado}
                        </p>
                        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                            {item.contexto}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

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
                className="w-full max-w-xs rounded-full px-8"
            >
                Comecar Quiz
            </Button>
        </div>
    )
}
