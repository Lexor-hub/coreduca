'use client'

import { motion } from 'framer-motion'

interface CulturalTipProps {
  texto: string
}

const tips = [
  'Na Coreia, a idade é contada de forma diferente — ao nascer, você já tem 1 ano!',
  'O Hangul foi criado em 1443 pelo Rei Sejong para que todos pudessem ler e escrever.',
  'Em coreano, existem dois sistemas de números: nativo coreano e sino-coreano.',
  'Coreanos usam as duas mãos ou apoiam o braço ao entregar algo a alguém mais velho.',
  '김치 (kimchi) tem mais de 200 variedades diferentes na Coreia!',
  'A palavra 대박 (daebak) é usada como "incrível!" e você ouve o tempo todo em K-dramas.',
  'Em coreano, o sobrenome vem antes do nome. Kim Taehyung = sobrenome Kim, nome Taehyung.',
  'O sistema de escrita Hangul é considerado um dos mais científicos do mundo.',
  '화이팅 (hwaiting) vem do inglês "fighting" e é um grito de incentivo!',
  'Na Coreia, é comum perguntar a idade ao conhecer alguém — define como você fala com a pessoa.',
]

export function CulturalTip({ texto }: CulturalTipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">
            Você sabia?
          </p>
          <p className="text-sm text-yellow-900 leading-relaxed">{texto}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function getRandomTip(index: number): string {
  return tips[index % tips.length]
}
