'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CommunityClubDefinition } from '@/lib/community'

interface CommunityHeroProps {
  recommendedClub: CommunityClubDefinition
  interestLabel?: string | null
}

export function CommunityHero({ recommendedClub, interestLabel }: CommunityHeroProps) {
  return (
    <Card className={`overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,rgba(25,92,255,0.95)_100%)] text-white shadow-[0_24px_60px_rgba(19,32,52,0.18)]`}>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Comunidade v2</p>
            <h2 className="max-w-sm text-2xl font-black leading-tight">
              Entre por um clube claro e compartilhe sem cara de rede social generica.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              Menos escolhas, prompts prontos e conversa mais facil para quem esta comecando no coreano.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white/12 px-4 py-3 text-center backdrop-blur">
            <p className="text-4xl">{recommendedClub.icon}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="border-0 bg-white/12 text-white">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Recomendado: {recommendedClub.title}
          </Badge>
          {interestLabel && (
            <Badge className="border-0 bg-white/12 text-white">
              Seu foco: {interestLabel}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
