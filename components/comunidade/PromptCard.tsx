'use client'

import { MessageCircleMore } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { CommunityPromptTemplate } from '@/lib/community'

interface PromptCardProps {
  prompt: CommunityPromptTemplate
  onClick: () => void
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="h-full border-0 bg-[linear-gradient(180deg,#ffffff,rgba(235,243,255,0.72))] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="space-y-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]">
            <MessageCircleMore className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">{prompt.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{prompt.description}</p>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
