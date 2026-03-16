import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function clearServerSession() {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()

    if (error && error.message !== 'Auth session missing!') {
        throw error
    }
}

export async function GET(request: Request) {
    const loginUrl = new URL('/login', request.url)

    try {
        await clearServerSession()
    } catch {
        loginUrl.searchParams.set('error', 'signout')
    }

    return NextResponse.redirect(loginUrl)
}

export async function POST() {
    try {
        await clearServerSession()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Nao foi possivel encerrar a sessao.'
        return NextResponse.json({ error: message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
}
