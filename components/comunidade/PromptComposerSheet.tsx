'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  coerceCommunityContextType,
  communityClubDefinitions,
  communityClubOrder,
  getCommunityPrompt,
  type CommunityClubSlug,
  type CommunityPromptTemplate,
} from '@/lib/community'
import { toContextDateIso } from '@/lib/community'
import type { CommunityContextType, CommunityPostKind } from '@/types/database'

const MAX_POST_LENGTH = 220

type ClubOption = {
  id: string
  slug: CommunityClubSlug
}

export type CommunityComposerPayload = {
  channelId: string
  clubSlug: CommunityClubSlug
  conteudo: string
  postKind: CommunityPostKind
  promptSlug: string | null
  contextType: CommunityContextType | null
  contextId: string | null
  contextLabel: string | null
  contextDate: string | null
}

interface PromptComposerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubOptions: ClubOption[]
  defaultClubSlug?: CommunityClubSlug
  lockedClub?: boolean
  initialPromptSlug?: string | null
  initialPrefill?: string | null
  initialPostKind?: CommunityPostKind | null
  initialContextType?: CommunityContextType | null
  initialContextId?: string | null
  initialContextLabel?: string | null
  initialContextDate?: string | null
  submitLabel?: string
  loading?: boolean
  error?: string | null
  onSubmit: (payload: CommunityComposerPayload) => Promise<void>
}

function toDateInputValue(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

export function PromptComposerSheet({
  open,
  onOpenChange,
  clubOptions,
  defaultClubSlug,
  lockedClub = false,
  initialPromptSlug,
  initialPrefill,
  initialPostKind,
  initialContextType,
  initialContextId,
  initialContextLabel,
  initialContextDate,
  submitLabel = 'Compartilhar',
  loading = false,
  error,
  onSubmit,
}: PromptComposerSheetProps) {
  const fallbackClubSlug = defaultClubSlug ?? clubOptions[0]?.slug ?? communityClubOrder[0]
  const [selectedClubSlug, setSelectedClubSlug] = useState<CommunityClubSlug>(fallbackClubSlug)
  const [selectedPromptSlug, setSelectedPromptSlug] = useState<string | null>(initialPromptSlug ?? null)
  const [content, setContent] = useState(initialPrefill ?? '')
  const [eventLabel, setEventLabel] = useState(initialContextLabel ?? '')
  const [eventDate, setEventDate] = useState(toDateInputValue(initialContextDate))
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const nextClubSlug = defaultClubSlug ?? clubOptions[0]?.slug ?? communityClubOrder[0]

    const frame = window.requestAnimationFrame(() => {
      setSelectedClubSlug(nextClubSlug)
      setSelectedPromptSlug(initialPromptSlug ?? null)
      setContent(initialPrefill ?? '')
      setEventLabel(initialContextLabel ?? '')
      setEventDate(toDateInputValue(initialContextDate))
      setLocalError(null)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [clubOptions, defaultClubSlug, initialContextDate, initialContextLabel, initialPrefill, initialPromptSlug, open])

  const clubMap = useMemo(() => {
    const map = new Map<CommunityClubSlug, string>()
    clubOptions.forEach((club) => map.set(club.slug, club.id))
    return map
  }, [clubOptions])

  const club = communityClubDefinitions[selectedClubSlug]
  const prompt = getCommunityPrompt(selectedClubSlug, selectedPromptSlug)
  const postKind = prompt?.postKind ?? (selectedClubSlug === fallbackClubSlug ? (initialPostKind ?? 'livre') : 'livre')
  const placeholder = prompt?.placeholder ?? `Compartilhe algo rapido com o clube ${club.shortTitle.toLowerCase()}.`
  const requiresEventContext = Boolean(prompt?.requiresContextLabel)

  const handlePromptSelect = (nextPrompt: CommunityPromptTemplate | null) => {
    setSelectedPromptSlug(nextPrompt?.slug ?? null)
    setLocalError(null)
  }

  const handleSubmit = async () => {
    const channelId = clubMap.get(selectedClubSlug)
    if (!channelId) {
      setLocalError('Nao foi possivel encontrar esse clube agora.')
      return
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setLocalError('Escreva algo antes de compartilhar.')
      return
    }

    if (trimmedContent.length > MAX_POST_LENGTH) {
      setLocalError('Seu texto passou do limite de 220 caracteres.')
      return
    }

    let contextType: CommunityContextType | null = null
    let contextId: string | null = null
    let contextLabel: string | null = null
    let contextDate: string | null = null

    if (requiresEventContext) {
      if (!eventLabel.trim()) {
        setLocalError('Adicione o nome do evento para abrir essa conversa.')
        return
      }

      contextType = 'evento'
      contextLabel = eventLabel.trim()
      contextDate = toContextDateIso(eventDate)
    } else if (selectedClubSlug === fallbackClubSlug && initialContextType) {
      contextType = coerceCommunityContextType(initialContextType)
      contextId = initialContextId ?? null
      contextLabel = initialContextLabel ?? null
      contextDate = initialContextDate ?? null
    } else if (prompt) {
      contextType = 'manual'
    }

    setLocalError(null)
    await onSubmit({
      channelId,
      clubSlug: selectedClubSlug,
      conteudo: trimmedContent,
      postKind,
      promptSlug: prompt?.slug ?? null,
      contextType,
      contextId,
      contextLabel,
      contextDate,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-6">
        <SheetHeader className="space-y-2">
          <SheetTitle>Compartilhar na comunidade</SheetTitle>
          <SheetDescription>
            Escolha um clube, use um prompt e publique algo curto sem cara de feed pesado.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Clube</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {clubOptions.map((clubOption) => {
                const optionDefinition = communityClubDefinitions[clubOption.slug]
                return (
                  <button
                    key={clubOption.slug}
                    onClick={() => {
                      if (lockedClub) return
                      setSelectedClubSlug(clubOption.slug)
                      setSelectedPromptSlug(null)
                      setLocalError(null)
                    }}
                    disabled={lockedClub}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedClubSlug === clubOption.slug
                        ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5'
                        : 'border-border/60 bg-white'
                    } ${lockedClub ? 'cursor-default' : ''}`}
                  >
                    <p className="text-sm font-bold">{optionDefinition.icon} {optionDefinition.shortTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{optionDefinition.eyebrow}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Prompt</p>
              <button
                onClick={() => handlePromptSelect(null)}
                className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
              >
                {club.freeformLabel}
              </button>
            </div>

            <div className="grid gap-3">
              {club.prompts.map((clubPrompt) => (
                <button
                  key={clubPrompt.slug}
                  onClick={() => handlePromptSelect(clubPrompt)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    prompt?.slug === clubPrompt.slug
                      ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/5'
                      : 'border-border/60 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold">{clubPrompt.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{clubPrompt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`border-0 ${club.surfaceClass}`}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {club.title}
              </Badge>
              {prompt && <Badge variant="secondary">{prompt.label}</Badge>}
            </div>

            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-32 rounded-3xl"
              placeholder={placeholder}
              maxLength={MAX_POST_LENGTH}
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {prompt ? 'Prompt guiado ativo' : 'Modo livre dentro do clube'}
              </span>
              <span className={content.length > MAX_POST_LENGTH ? 'text-red-600' : 'text-muted-foreground'}>
                {content.length}/{MAX_POST_LENGTH}
              </span>
            </div>
          </div>

          {requiresEventContext && (
            <div className="space-y-3 rounded-3xl bg-secondary/60 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Detalhe do evento</p>
              <Input
                value={eventLabel}
                onChange={(event) => setEventLabel(event.target.value)}
                placeholder="Nome do evento"
                className="h-12 rounded-2xl bg-white"
              />
              <div className="flex items-center gap-2 rounded-2xl bg-white px-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className="h-12 border-0 px-0"
                />
              </div>
            </div>
          )}

          {(localError || error) && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {localError || error}
            </p>
          )}
        </div>

        <SheetFooter className="px-4 pb-0">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="h-12 w-full rounded-full bg-[var(--color-coreduca-blue)] text-white"
          >
            {loading ? 'Compartilhando...' : submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
