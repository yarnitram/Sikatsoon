// ============================================================================
// Sikatsoon: Pure Viral Velocity Scoring Engine
// ============================================================================

export interface ScoringInput {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  publishedAt: number; // Unix timestamp in seconds
  currentTime?: number; // Optional injection for deterministic testing
}

/**
 * Calculates velocity in views per hour.
 * Clamps elapsed time to minimum 1 hour to prevent infinite spike distortion for newly published clips.
 */
export function calculateVelocity(
  views: number,
  publishedAt: number,
  currentTime: number = Math.floor(Date.now() / 1000)
): number {
  if (views <= 0) return 0;
  const elapsedSeconds = Math.max(currentTime - publishedAt, 0);
  const elapsedHours = Math.max(elapsedSeconds / 3600, 1);
  return views / elapsedHours;
}

/**
 * Calculates audience engagement depth:
 * Shares carry 3x weight, comments carry 2x weight, likes carry 1x weight.
 * Enforces Math.max(views, 1) to guard against zero division.
 */
export function calculateInteractionRatio(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views <= 0) return 0;
  const weightedInteractions = likes + 2 * comments + 3 * shares;
  return weightedInteractions / Math.max(views, 1);
}

/**
 * Pure Viral Velocity Scoring Algorithm:
 * ViralScore = Velocity * InteractionRatio
 *
 * Invariants:
 * 1. If views == 0, ViralScore = 0.
 * 2. Division-by-zero is strictly guarded.
 * 3. Result is rounded to 2 decimal places.
 */
export function calculateViralScore(input: ScoringInput): number {
  const {
    views,
    likes,
    comments,
    shares,
    publishedAt,
    currentTime = Math.floor(Date.now() / 1000),
  } = input;

  if (views <= 0) {
    return 0;
  }

  const velocity = calculateVelocity(views, publishedAt, currentTime);
  const interactionRatio = calculateInteractionRatio(likes, comments, shares, views);

  const rawScore = velocity * interactionRatio;
  return Number(rawScore.toFixed(2));
}
