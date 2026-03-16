'use client'

const typeIcons: Record<string, { icon: string; label: string }> = {
  multipla_escolha: { icon: '🔤', label: 'Múltipla escolha' },
  coreano_para_portugues: { icon: '🔄', label: 'Tradução KR→PT' },
  portugues_para_coreano: { icon: '🔄', label: 'Tradução PT→KR' },
  verdadeiro_falso: { icon: '✅', label: 'Verdadeiro ou Falso' },
  associar_par: { icon: '🧩', label: 'Associar pares' },
  completar_frase: { icon: '✍️', label: 'Completar frase' },
}

interface QuestionTypeIconProps {
  tipo: string
  showLabel?: boolean
  className?: string
}

export function QuestionTypeIcon({ tipo, showLabel = false, className = '' }: QuestionTypeIconProps) {
  const info = typeIcons[tipo] ?? { icon: '❓', label: tipo }
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <span>{info.icon}</span>
      {showLabel && <span className="text-muted-foreground">{info.label}</span>}
    </span>
  )
}
