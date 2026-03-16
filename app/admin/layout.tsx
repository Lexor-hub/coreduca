'use client'

import { LayoutDashboard, BookOpen, Mic, Bot, Users, ShoppingBag, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/missoes', label: 'Missões', icon: BookOpen },
    { href: '/admin/pronuncia', label: 'Pronúncia', icon: Mic },
    { href: '/admin/personas', label: 'Personas IA', icon: Bot },
    { href: '/admin/comunidade', label: 'Comunidade', icon: Users },
    { href: '/admin/store', label: 'Store', icon: ShoppingBag },
    { href: '/admin/usuarios', label: 'Usuárias', icon: UserCog },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-secondary/30 flex">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <span className="text-2xl">🇰🇷</span>
                    <span className="font-extrabold text-lg">Coreduca</span>
                    <span className="text-xs bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] px-2 py-0.5 rounded-full font-bold">Admin</span>
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
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] font-bold'
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

            {/* Main content */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
