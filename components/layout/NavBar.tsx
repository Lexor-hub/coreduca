'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Mic, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
    { href: '/home', label: 'Início', icon: Home },
    { href: '/aprender', label: 'Aprender', icon: BookOpen },
    { href: '/pronuncia', label: 'Pronúncia', icon: Mic },
    { href: '/comunidade', label: 'Social', icon: Users },
    { href: '/perfil', label: 'Perfil', icon: User },
]

export function NavBar() {
    const pathname = usePathname()
    const shouldHideNav =
        pathname.startsWith('/aprender/missao/')
        || pathname === '/aprender/revisao'

    if (shouldHideNav) {
        return null
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-border safe-area-bottom">
            <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative min-w-[60px]',
                                isActive
                                    ? 'text-[var(--color-coreduca-blue)]'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[var(--color-coreduca-blue)]/10 rounded-xl"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className="h-5 w-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                            <span className={cn(
                                'text-[10px] font-semibold relative z-10',
                                isActive && 'font-bold'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
