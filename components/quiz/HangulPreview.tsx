'use client'

import { motion } from 'framer-motion'

interface HangulPreviewProps {
  caractere: string
  romanizacao: string
  exemplo?: string
  exemploTraducao?: string
}

export function HangulPreview({ caractere, romanizacao, exemplo, exemploTraducao }: HangulPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 text-center border border-blue-100"
    >
      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
        Hangul do dia
      </p>
      <motion.p
        className="text-7xl font-black text-[var(--color-coreduca-blue)] leading-none mb-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
      >
        {caractere}
      </motion.p>
      <p className="text-lg text-muted-foreground font-medium">{romanizacao}</p>
      {exemplo && (
        <div className="mt-4 pt-4 border-t border-blue-100">
          <p className="text-xl font-bold">{exemplo}</p>
          {exemploTraducao && (
            <p className="text-sm text-muted-foreground mt-1">{exemploTraducao}</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
