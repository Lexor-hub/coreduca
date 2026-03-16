import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/database"
import { createServerClient } from "@/lib/supabase/server"

export type RouteProfile = Pick<
  Profile,
  "id" | "is_admin" | "beta_access" | "plano" | "dorama_favorito" | "premium_expires_at"
>

type RequireRouteSessionOptions = {
  requireAdmin?: boolean
  allowWithoutBeta?: boolean
}

type RequireRouteSessionResult =
  | {
      supabase: Awaited<ReturnType<typeof createServerClient>>
      user: User
      profile: RouteProfile
      response?: undefined
    }
  | {
      supabase?: undefined
      user?: undefined
      profile?: undefined
      response: NextResponse
    }

export function hasActivePremium(profile: Pick<Profile, "plano" | "premium_expires_at"> | null | undefined) {
  if (!profile) {
    return false
  }

  if (profile.plano !== "premium_mensal" && profile.plano !== "premium_anual") {
    return false
  }

  if (!profile.premium_expires_at) {
    return true
  }

  return new Date(profile.premium_expires_at).getTime() > Date.now()
}

export async function requireRouteSession(
  options: RequireRouteSessionOptions = {}
): Promise<RequireRouteSessionResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { error: "Sessao invalida. Faca login novamente." },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_admin, beta_access, plano, dorama_favorito, premium_expires_at")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return {
      response: NextResponse.json({ error: "Perfil nao encontrado." }, { status: 403 }),
    }
  }

  if (!options.allowWithoutBeta && !profile.beta_access) {
    return {
      response: NextResponse.json(
        { error: "Este acesso esta restrito ao beta fechado." },
        { status: 403 }
      ),
    }
  }

  if (options.requireAdmin && !profile.is_admin) {
    return {
      response: NextResponse.json({ error: "Acesso administrativo exigido." }, { status: 403 }),
    }
  }

  return {
    supabase,
    user,
    profile: profile as RouteProfile,
  }
}
