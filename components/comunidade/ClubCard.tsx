'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CommunityClubDefinition } from '@/lib/community'

interface ClubCardProps {
  club: CommunityClubDefinition
  href: string
  recommended?: boolean
  postCount?: number
  latestSnippet?: string | null
}

export function ClubCard({ club, href, recommended = false, postCount = 0, latestSnippet }: ClubCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={href}>
        <Card className="overflow-hidden border-0 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${club.surfaceClass}`}>
                  <span className="text-2xl">{club.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black">{club.title}</h3>
                  <p className="text-sm text-muted-foreground">{club.description}</p>
                </div>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex flex-wrap gap-2">
              {recommended && (
                <Badge className="border-0 bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Recomendado
                </Badge>
              )}
              <Badge variant="secondary">{postCount} conversas</Badge>
            </div>

            {latestSnippet ? (
              <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                {latestSnippet}
              </p>
            ) : (
              <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                {club.emptyDescription}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
