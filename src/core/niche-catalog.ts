/**
 * Sikatsoon: Curated Niche Catalog & Caption Hashtag Extractor
 *
 * Provides:
 * 1. Curated starter catalog of top viral creator niches.
 * 2. Pure hashtag parsing engine to extract and discover trending tags from video captions.
 */

export interface CuratedNiche {
  tag: string;
  displayName: string;
  category: "AI & Tech" | "E-Commerce" | "Business & Finance" | "Lifestyle & UGC" | "Health & Fitness";
}

export const POPULAR_VIRAL_NICHES: CuratedNiche[] = [
  // AI & Tech
  { tag: "ai-tools", displayName: "AI Tools", category: "AI & Tech" },
  { tag: "chatgpt", displayName: "ChatGPT", category: "AI & Tech" },
  { tag: "saas", displayName: "SaaS", category: "AI & Tech" },
  { tag: "automation", displayName: "Automation", category: "AI & Tech" },
  { tag: "coding", displayName: "Coding", category: "AI & Tech" },

  // E-Commerce & Dropshipping
  { tag: "dropshipping", displayName: "Dropshipping", category: "E-Commerce" },
  { tag: "tiktokshop", displayName: "TikTok Shop", category: "E-Commerce" },
  { tag: "amazonfinds", displayName: "Amazon Finds", category: "E-Commerce" },
  { tag: "ecommerce", displayName: "E-Commerce", category: "E-Commerce" },

  // Business & Finance
  { tag: "sidehustle", displayName: "Side Hustle", category: "Business & Finance" },
  { tag: "money", displayName: "Money", category: "Business & Finance" },
  { tag: "marketing", displayName: "Marketing", category: "Business & Finance" },
  { tag: "productivity", displayName: "Productivity", category: "Business & Finance" },

  // Lifestyle & UGC
  { tag: "lifehacks", displayName: "Lifehacks", category: "Lifestyle & UGC" },
  { tag: "gadgets", displayName: "Gadgets", category: "Lifestyle & UGC" },
  { tag: "unboxing", displayName: "Unboxing", category: "Lifestyle & UGC" },
  { tag: "pov", displayName: "POV", category: "Lifestyle & UGC" },

  // Health & Fitness
  { tag: "fitness", displayName: "Fitness", category: "Health & Fitness" },
  { tag: "gymtok", displayName: "GymTok", category: "Health & Fitness" },
  { tag: "biohacking", displayName: "Biohacking", category: "Health & Fitness" },
];

/**
 * Standardize and sanitize a hashtag string:
 * Strips leading '#', converts to lowercase, trims whitespace and special characters.
 */
export function formatNicheTag(rawTag: string): string {
  if (!rawTag) return "";
  return rawTag
    .toLowerCase()
    .trim()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9_\-]/g, "")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generic spam/meta hashtags to exclude when learning new niches from captions
 */
const GENERIC_TAG_BLACKLIST = new Set([
  "fyp",
  "foryou",
  "foryoupage",
  "viral",
  "trending",
  "explore",
  "tiktok",
  "duet",
  "greenscreen",
]);

/**
 * Parse and extract clean hashtags from a TikTok video caption.
 * Returns an array of unique, lowercase, sanitized tags.
 */
export function extractHashtagsFromCaption(caption: string): string[] {
  if (!caption) return [];

  const hashtagRegex = /#([a-zA-Z0-9_\-]+)/g;
  const matches = caption.match(hashtagRegex);
  if (!matches) return [];

  const uniqueTags = new Set<string>();

  for (const match of matches) {
    const clean = formatNicheTag(match);
    if (clean && clean.length >= 2 && clean.length <= 40) {
      if (!GENERIC_TAG_BLACKLIST.has(clean)) {
        uniqueTags.add(clean);
      }
    }
  }

  return Array.from(uniqueTags);
}
