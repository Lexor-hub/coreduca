'use client'

import Link from 'next/link'
import { MessageCircle, Pin } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { communityReactionEmojis, parseAvatar, timeAgo } from '@/lib/coreduca'
import { formatCommunityContextDate, getCommunityPostKindMeta } from '@/lib/community'
import type { CommunityPost } from '@/types/database'

type CommunityFeedPost = Pick<
  CommunityPost,
  | 'id'
  | 'channel_id'
  | 'conteudo'
  | 'post_kind'
  | 'context_label'
  | 'context_date'
  | 'reacoes'
  | 'total_comentarios'
  | 'pinned'
  | 'created_at'
  | 'user_id'
> & {
  profiles?: CommunityPost['profiles']
  post_reactions?: Array<{ emoji: string; user_id: string }>
}

interface CommunityPostCardProps {
  post: CommunityFeedPost
  currentUserId?: string | null
  href: string
  onToggleReaction: (postId: string, emoji: string, reacted: boolean) => void
  onOpenProfile: (userId: string) => void
  reactionDisabled?: boolean
}

export function CommunityPostCard({
  post,
  currentUserId,
  href,
  onToggleReaction,
  onOpenProfile,
  reactionDisabled = false,
}: CommunityPostCardProps) {
  const postProfile = post.profiles
  const avatarParsed = parseAvatar(postProfile?.avatar_url)
  const initials = (postProfile?.display_name || postProfile?.username || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const userReactions = new Set(
    (post.post_reactions || [])
      .filter((reaction) => reaction.user_id === currentUserId)
      .map((reaction) => reaction.emoji)
  )
  const kindMeta = getCommunityPostKindMeta(post.post_kind)
  const contextDate = formatCommunityContextDate(post.context_date)

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onOpenProfile(post.user_id)}>
            <Avatar className="h-9 w-9">
              {avatarParsed ? (
                <AvatarFallback className="text-lg" style={{ backgroundColor: avatarParsed.color }}>
                  {avatarParsed.emoji}
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </button>

          <div className="min-w-0 flex-1">
            <button onClick={() => onOpenProfile(post.user_id)} className="truncate text-sm font-bold hover:underline text-left">
              {postProfile?.display_name || postProfile?.username}
            </button>
            <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={`border-0 ${kindMeta.className}`}>{kindMeta.label}</Badge>
          {post.pinned && (
            <Badge className="border-0 bg-amber-100 text-amber-800">
              <Pin className="mr-1 h-3 w-3" />
              Destaque
            </Badge>
          )}
          {post.context_label && (
            <Badge variant="secondary">
              {post.context_label}
              {contextDate ? ` · ${contextDate}` : ''}
            </Badge>
          )}
        </div>

        <Link href={href} className="block">
          <p className="text-sm leading-relaxed">{post.conteudo}</p>
        </Link>

        <div className="flex items-center gap-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1">
            {communityReactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(post.id, emoji, userReactions.has(emoji))}
                disabled={reactionDisabled}
                className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-xs transition-colors ${
                  userReactions.has(emoji)
                    ? 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-semibold text-muted-foreground">{post.reacoes?.[emoji] ?? 0}</span>
              </button>
            ))}
          </div>

          <Link href={href} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="font-semibold">{post.total_comentarios} respostas</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
