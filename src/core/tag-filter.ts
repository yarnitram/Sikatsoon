/**
 * Sikatsoon: Untapped Hub (Untpd) Tag Query & Multi-State Filtering Engine
 *
 * Implements interactive tag stacking with:
 * - Multi-state chips (+ Include vs. - Exclude)
 * - Boolean matching (ANY / OR vs. ALL / AND)
 * - Comprehensive scope (niche, caption hashtags, caption keywords)
 * - 1-Click Discovery Packs
 */

export type FilterChipState = "include" | "exclude";

export interface TagFilterChip {
  tag: string;
  state: FilterChipState;
}

export type MatchMode = "ANY" | "ALL";

export interface FilterableVideo {
  id: string;
  niche: string;
  caption: string;
  viralScore: number;
  [key: string]: any;
}

export interface DiscoveryPack {
  id: string;
  name: string;
  description?: string;
  chips: TagFilterChip[];
  isBuiltIn?: boolean;
}

/**
 * Built-in Untpd Discovery Packs
 */
export const BUILT_IN_DISCOVERY_PACKS: DiscoveryPack[] = [
  {
    id: "pure-organic",
    name: "Pure Organic",
    description: "High relatability, filters out ads and dropshipping",
    isBuiltIn: true,
    chips: [
      { tag: "viral", state: "include" },
      { tag: "relatable", state: "include" },
      { tag: "ad", state: "exclude" },
      { tag: "dropship", state: "exclude" },
    ],
  },
  {
    id: "ugc-solver",
    name: "UGC / Problem Solver",
    description: "High purchase-intent product demos and lifehacks",
    isBuiltIn: true,
    chips: [
      { tag: "amazonfinds", state: "include" },
      { tag: "lifehacks", state: "include" },
      { tag: "musthaves", state: "include" },
    ],
  },
  {
    id: "weird-ctr",
    name: "Weird & High CTR",
    description: "High hook curiosity and scroll-stopping loops",
    isBuiltIn: true,
    chips: [
      { tag: "weird", state: "include" },
      { tag: "oddlysatisfying", state: "include" },
      { tag: "pov", state: "include" },
    ],
  },
];

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Cycle a chip's state: include (+) -> exclude (-) -> remove (null)
 */
export function cycleChipState(currentState: FilterChipState): FilterChipState | null {
  if (currentState === "include") return "exclude";
  return null;
}

/**
 * Check if a video matches a single tag across niche, caption hashtags, and caption text.
 */
export function videoMatchesTag(video: FilterableVideo, rawTag: string): boolean {
  const tag = rawTag.toLowerCase().trim().replace(/^#/, "");
  if (!tag) return false;

  // 1. Primary Niche match
  if (video.niche) {
    const cleanNiche = video.niche.toLowerCase().trim().replace(/^#/, "");
    if (cleanNiche === tag || cleanNiche.includes(tag)) {
      return true;
    }
  }

  const caption = (video.caption || "").toLowerCase();
  if (!caption) return false;

  // 2. Hashtag pattern in caption (#tag)
  const escaped = escapeRegExp(tag);
  const hashtagRegex = new RegExp(`#${escaped}(?:\\b|_|$)`, "i");
  if (hashtagRegex.test(caption)) {
    return true;
  }

  // 3. Keyword / Substring match in caption prose
  if (caption.includes(tag)) {
    return true;
  }

  return false;
}

export interface FilterResult<T> {
  matchedVideos: T[];
  yieldCount: number;
  excludedCount: number;
}

/**
 * Filter an array of videos using the Untpd tag query engine.
 *
 * Rules:
 * 1. Hard Exclusion: If a video matches ANY exclude (-) chip, immediately drop it.
 * 2. If no include (+) chips are defined, all non-excluded videos match.
 * 3. In ANY (OR) mode: Video matches if it contains AT LEAST ONE include (+) chip.
 * 4. In ALL (AND) mode: Video matches only if it contains ALL include (+) chips.
 * 5. If chips array is empty, all videos are returned.
 * 6. Results are ordered by viralScore descending.
 */
export function filterVideosByTags<T extends FilterableVideo>(
  videos: T[],
  chips: TagFilterChip[],
  matchMode: MatchMode = "ANY"
): FilterResult<T> {
  if (!chips || chips.length === 0) {
    const sorted = [...videos].sort((a, b) => b.viralScore - a.viralScore);
    return {
      matchedVideos: sorted,
      yieldCount: sorted.length,
      excludedCount: 0,
    };
  }

  const includeChips = chips.filter((c) => c.state === "include");
  const excludeChips = chips.filter((c) => c.state === "exclude");

  let excludedCount = 0;
  const matched: T[] = [];

  for (const video of videos) {
    // 1. Check Hard Exclusions first
    const isExcluded = excludeChips.some((c) => videoMatchesTag(video, c.tag));
    if (isExcluded) {
      excludedCount++;
      continue;
    }

    // 2. If no include chips exist, every non-excluded video qualifies
    if (includeChips.length === 0) {
      matched.push(video);
      continue;
    }

    // 3. Evaluate Inclusion based on MatchMode
    if (matchMode === "ANY") {
      const hasAnyInclude = includeChips.some((c) => videoMatchesTag(video, c.tag));
      if (hasAnyInclude) {
        matched.push(video);
      }
    } else {
      // ALL (AND)
      const hasAllIncludes = includeChips.every((c) => videoMatchesTag(video, c.tag));
      if (hasAllIncludes) {
        matched.push(video);
      }
    }
  }

  matched.sort((a, b) => b.viralScore - a.viralScore);

  return {
    matchedVideos: matched,
    yieldCount: matched.length,
    excludedCount,
  };
}
