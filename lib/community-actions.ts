import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunityContextType, CommunityPostKind, Database } from '@/types/database'

type CommunitySupabase = SupabaseClient<Database>

export type CreateCommunityPostInput = {
  userId: string
  channelId: string
  conteudo: string
  postKind: CommunityPostKind
  promptSlug: string | null
  contextType: CommunityContextType | null
  contextId: string | null
  contextLabel: string | null
  contextDate: string | null
}

export type ToggleCommunityReactionInput = {
  postId: string
  userId: string
  emoji: string
  reacted: boolean
}

export type CreateCommunityCommentInput = {
  postId: string
  userId: string
  conteudo: string
}

export function isLegacyCommunityColumnsError(message: string) {
  return message.includes('column') && message.includes('community_posts')
}

export async function createCommunityPost(
  supabase: CommunitySupabase,
  payload: CreateCommunityPostInput
) {
  const insertPayload = {
    user_id: payload.userId,
    channel_id: payload.channelId,
    conteudo: payload.conteudo,
    post_kind: payload.postKind,
    prompt_slug: payload.promptSlug,
    context_type: payload.contextType,
    context_id: payload.contextId,
    context_label: payload.contextLabel,
    context_date: payload.contextDate,
  }

  const { error } = await supabase.from('community_posts').insert(insertPayload)

  if (!error) {
    return { error: null }
  }

  if (!isLegacyCommunityColumnsError(error.message)) {
    return { error }
  }

  const fallback = await supabase.from('community_posts').insert({
    user_id: payload.userId,
    channel_id: payload.channelId,
    conteudo: payload.conteudo,
  })

  return { error: fallback.error }
}

export async function toggleCommunityReaction(
  supabase: CommunitySupabase,
  payload: ToggleCommunityReactionInput
) {
  if (payload.reacted) {
    return supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', payload.postId)
      .eq('user_id', payload.userId)
      .eq('emoji', payload.emoji)
  }

  return supabase.from('post_reactions').insert({
    post_id: payload.postId,
    user_id: payload.userId,
    emoji: payload.emoji,
  })
}

export async function createCommunityComment(
  supabase: CommunitySupabase,
  payload: CreateCommunityCommentInput
) {
  return supabase.from('community_comments').insert({
    post_id: payload.postId,
    user_id: payload.userId,
    conteudo: payload.conteudo,
  })
}
