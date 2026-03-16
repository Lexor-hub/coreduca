type TrailLike = {
  id: string
}

type TrailProgressLike = {
  percentual?: number | null
}

export function isTrailComplete(progress: TrailProgressLike | null | undefined) {
  return (progress?.percentual ?? 0) >= 100
}

export function isTrailUnlocked<TTrail extends TrailLike>(
  trails: TTrail[],
  progressMap: Record<string, TrailProgressLike | undefined>,
  index: number
) {
  if (index <= 0) return true

  const previousTrail = trails[index - 1]
  if (!previousTrail) return true

  return isTrailComplete(progressMap[previousTrail.id])
}

export function countUnlockedTrails<TTrail extends TrailLike>(
  trails: TTrail[],
  progressMap: Record<string, TrailProgressLike | undefined>
) {
  return trails.reduce((total, _, index) => total + (isTrailUnlocked(trails, progressMap, index) ? 1 : 0), 0)
}

export function getTrailLockState<TTrail extends TrailLike>(
  trails: TTrail[],
  progressMap: Record<string, TrailProgressLike | undefined>,
  trailId: string
) {
  const currentIndex = trails.findIndex((trail) => trail.id === trailId)

  if (currentIndex === -1) {
    return {
      isLocked: false,
      previousTrailId: null as string | null,
    }
  }

  const previousTrail = currentIndex > 0 ? trails[currentIndex - 1] : null

  return {
    isLocked: !isTrailUnlocked(trails, progressMap, currentIndex),
    previousTrailId: previousTrail?.id ?? null,
  }
}
