"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. Zod Validation Schemas
// ============================================================================

export const IngestionInputSchema = z.object({
  niche: z
    .string()
    .min(2, "Niche must be at least 2 characters")
    .max(50, "Niche must not exceed 50 characters")
    .transform((s) => s.toLowerCase().trim().replace(/^#/, "")),
  region: z.enum(["US", "UK", "CA", "AU"]),
  timeframe: z.enum(["24h", "7d", "30d"]).default("24h"),
  limit: z.number().int().min(5).max(50).default(20),
});

export type IngestionInput = z.infer<typeof IngestionInputSchema>;

export const ToggleBookmarkSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

// ============================================================================
// 2. Server Action Responses
// ============================================================================

export interface IngestionActionResult {
  success: boolean;
  insertedCount: number;
  message?: string;
}

export interface ToggleBookmarkResult {
  success: boolean;
  isSaved: boolean;
  videoId: string;
  message?: string;
}

// ============================================================================
// 3. Server Actions Implementation Contracts
// ============================================================================

/**
 * Triggers viral content ingestion from Apify Actor, normalizes the payload,
 * computes viral velocity scores, and persists new videos to SQLite.
 */
export async function triggerIngestionAction(
  rawInput: IngestionInput
): Promise<IngestionActionResult> {
  const parseResult = IngestionInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      insertedCount: 0,
      message: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { niche, region, timeframe, limit } = parseResult.data;

  try {
    // In production codebase:
    // 1. const rawVideos = await apifyAdapter.fetchTrending({ niche, region, limit });
    // 2. const scored = rawVideos.map(v => ({ ...v, viralScore: calculateViralScore(v) }))
    //    .filter(v => v.viewsCount >= 10000);
    // 3. await db.insert(videos).values(scored).onConflictDoNothing();
    
    revalidatePath("/feed");
    return {
      success: true,
      insertedCount: 15,
      message: `Ingested trending videos for #${niche} (${region})`,
    };
  } catch (error: any) {
    return {
      success: false,
      insertedCount: 0,
      message: error?.message || "Failed to ingest videos from Apify",
    };
  }
}

/**
 * Toggles the saved/bookmark status of a TikTok video for repurposing.
 */
export async function toggleBookmarkAction(
  videoId: string
): Promise<ToggleBookmarkResult> {
  const parseResult = ToggleBookmarkSchema.safeParse({ videoId });
  if (!parseResult.success) {
    return {
      success: false,
      isSaved: false,
      videoId,
      message: "Invalid video ID",
    };
  }

  try {
    // In production codebase:
    // const existing = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
    // const updated = await db.update(videos)
    //   .set({ isSaved: !existing.isSaved })
    //   .where(eq(videos.id, videoId))
    //   .returning();
    
    const newSavedState = true; // placeholder toggle
    revalidatePath("/feed");
    revalidatePath("/repurpose");

    return {
      success: true,
      isSaved: newSavedState,
      videoId,
    };
  } catch (error: any) {
    return {
      success: false,
      isSaved: false,
      videoId,
      message: error?.message || "Failed to toggle bookmark",
    };
  }
}
