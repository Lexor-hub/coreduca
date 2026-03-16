'use client'

import { ArrowLeft, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

interface TopBarProps {
    title?: string
    showBack?: boolean
    showNotifications?: boolean
    rightContent?: React.ReactNode
}

export function TopBar({ title, showBack = false, showNotifications = true, rightContent }: TopBarProps) {
    const router = useRouter()

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
            <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={() => router.back()}
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    {title && title === 'Home' ? (
                        <Logo className="h-6" />
                    ) : title ? (
                        <h1 className="text-lg font-bold text-foreground">{title}</h1>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {rightContent}
                    {showNotifications && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full relative"
                            aria-label="Notificações"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[var(--color-coreduca-red)] rounded-full" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
