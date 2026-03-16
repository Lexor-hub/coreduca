'use client'

import { LayoutDashboard, BookOpen, Mic, Bot, Users, ShoppingBag, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/missoes', label: 'Missoes', icon: BookOpen },
    { href: '/admin/pronuncia', label: 'Pronuncia', icon: Mic },
    { href: '/admin/personas', label: 'Personas IA', icon: Bot },
    { href: '/admin/comunidade', label: 'Comunidade', icon: Users },
    { href: '/admin/store', label: 'Store', icon: ShoppingBag },
    { href: '/admin/usuarios', label: 'Usuarias', icon: UserCog },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="flex min-h-screen items-center justify-center px-6 md:hidden">
                <div className="max-w-sm rounded-3xl border border-border/70 bg-white p-6 text-center shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-coreduca-blue)]">
                        Painel admin
                    </p>
                    <h1 className="mt-3 text-2xl font-black">Disponivel apenas em desktop</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        O painel administrativo foi mantido como desktop-first nesta rodada para evitar uma experiencia quebrada no celular.
                    </p>
                </div>
            </div>

            <div className="hidden min-h-screen md:flex">
                <aside className="flex w-64 flex-col border-r border-border bg-white p-4">
                    <div className="mb-8 flex items-center gap-2 px-2">
                        <span className="text-2xl">🇰🇷</span>
                        <span className="text-lg font-extrabold">Coreduca</span>
                        <span className="rounded-full bg-[var(--color-coreduca-blue)]/10 px-2 py-0.5 text-xs font-bold text-[var(--color-coreduca-blue)]">
                            Admin
                        </span>
                    </div>

                    <nav className="space-y-1">
                        {adminLinks.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-[var(--color-coreduca-blue)]/10 font-bold text-[var(--color-coreduca-blue)]'
                                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                <main className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
