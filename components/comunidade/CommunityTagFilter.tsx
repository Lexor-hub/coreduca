'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { CommunityTagFilterValue } from '@/lib/community'

interface CommunityTagFilterProps {
  options: Array<{ value: CommunityTagFilterValue; label: string }>
  activeValue: CommunityTagFilterValue
  onChange: (value: CommunityTagFilterValue) => void
}

export function CommunityTagFilter({ options, activeValue, onChange }: CommunityTagFilterProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeValue === option.value
                ? 'bg-[var(--color-coreduca-blue)] text-white shadow-md shadow-[var(--color-coreduca-blue)]/25'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
