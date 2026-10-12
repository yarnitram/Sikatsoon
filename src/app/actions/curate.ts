"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db, videos, niches } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ApifyTikTokAdapter } from "@/ingestion/apify-adapter";
import { mediaService } from "@/services/media-service";

// ============================================================================
// 1. Zod Validation Schemas
// ============================================================================

const IngestionInputSchema = z.object({
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

const ToggleBookmarkSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

// ============================================================================
// 2. Server Action Responses
// ============================================================================

export interface FeedVideoItem {
  id: string;
  authorUsername: string;
  region: "US" | "UK" | "CA" | "AU";
  niche: string;
  caption: string;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  viralScore: number;
  publishedAt: number;
  videoUrl: string;
  isSaved: boolean;
  localFilePath?: string | null;
  downloadStatus?: "IDLE" | "DOWNLOADING" | "DOWNLOADED" | "FAILED";
}

export interface NicheSummaryItem {
  id: string;
  tag: string;
  videoCount: number;
}

export interface IngestionActionResult {
  success: boolean;
  insertedCount: number;
  message?: string;
  videos?: FeedVideoItem[];
  niches?: NicheSummaryItem[];
}

export interface ToggleBookmarkResult {
  success: boolean;
  isSaved: boolean;
  videoId: string;
  message?: string;
}

// ============================================================================
// 3. Server Actions Implementation
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
    const adapter = new ApifyTikTokAdapter();
    const rawVideos = await adapter.fetchTrending({ niche, region, limit });
    const scoredVideos = adapter.processAndScore(rawVideos);

    let inserted = 0;
    for (const v of scoredVideos) {
      await db
        .insert(videos)
        .values({
          id: v.id,
          authorUsername: v.authorUsername,
          region: v.region,
          niche: v.niche,
          caption: v.caption,
          viewsCount: v.views,
          likesCount: v.likes,
          sharesCount: v.shares,
          commentsCount: v.comments,
          viralScore: v.viralScore,
          publishedAt: v.publishedAt,
          videoUrl: v.videoUrl,
          isSaved: false,
          downloadStatus: "IDLE",
          transcriptionStatus: "IDLE",
        })
        .onConflictDoUpdate({
          target: videos.id,
          set: {
            viewsCount: v.views,
            likesCount: v.likes,
            sharesCount: v.shares,
            commentsCount: v.comments,
            viralScore: v.viralScore,
          },
        });
      inserted++;
    }

    // Ensure the niche is registered in the niches table
    await db
      .insert(niches)
      .values({
        id: niche,
        tag: niche,
        displayName: niche.toUpperCase(),
      })
      .onConflictDoNothing();

    // Auto-download top breakout videos (top 3) via yt-dlp so they are instantly playable
    const topBreakouts = scoredVideos.slice(0, 3);
    for (const topVideo of topBreakouts) {
      try {
        const localPath = await mediaService.downloadVideo(topVideo.id, topVideo.videoUrl);
        await db
          .update(videos)
          .set({ localFilePath: localPath, downloadStatus: "DOWNLOADED" })
          .where(eq(videos.id, topVideo.id));
      } catch (dlErr) {
        console.warn(`Could not auto-download clip ${topVideo.id}:`, dlErr);
      }
    }

    revalidatePath("/feed");
    revalidatePath("/repurpose");

    const feedData = await getFeedDataAction();

    return {
      success: true,
      insertedCount: inserted,
      message: `Ingested ${inserted} viral videos for #${niche} (${region})`,
      videos: feedData.videos,
      niches: feedData.niches,
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
    const [existing] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        isSaved: false,
        videoId,
        message: `Video ${videoId} not found in database`,
      };
    }

    const newSavedState = !existing.isSaved;
    await db
      .update(videos)
      .set({ isSaved: newSavedState })
      .where(eq(videos.id, videoId));

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

/**
 * Query videos for the Feed from SQLite, ordered by viral score descending.
 */
export async function getFeedVideos(niche?: string) {
  if (niche) {
    return db
      .select()
      .from(videos)
      .where(eq(videos.niche, niche.toLowerCase()))
      .orderBy(desc(videos.viralScore));
  }
  return db.select().from(videos).orderBy(desc(videos.viralScore));
}

/**
 * Query saved videos for the Repurpose Lab.
 */
export async function getSavedVideos() {
  return db
    .select()
    .from(videos)
    .where(eq(videos.isSaved, true))
    .orderBy(desc(videos.viralScore));
}

/**
 * Query all tracked niches with counts.
 */
export async function getNiches() {
  return db.select().from(niches);
}

/**
 * Query all feed videos and niches formatted for UI presentation.
 */
export async function getFeedDataAction(): Promise<{
  videos: FeedVideoItem[];
  niches: NicheSummaryItem[];
}> {
  const rawVideos = await db.select().from(videos).orderBy(desc(videos.viralScore));
  const mappedVideos: FeedVideoItem[] = rawVideos.map((v) => ({
    id: v.id,
    authorUsername: v.authorUsername,
    region: (v.region as "US" | "UK" | "CA" | "AU") || "US",
    niche: v.niche,
    caption: v.caption || "",
    viewsCount: v.viewsCount,
    likesCount: v.likesCount,
    sharesCount: v.sharesCount,
    commentsCount: v.commentsCount,
    viralScore: v.viralScore,
    publishedAt: v.publishedAt,
    videoUrl: v.videoUrl,
    isSaved: Boolean(v.isSaved),
    localFilePath: v.localFilePath,
    downloadStatus: v.downloadStatus as any,
  }));

  const rawNiches = await db.select().from(niches);
  const mappedNiches: NicheSummaryItem[] = rawNiches.map((n) => {
    const count = mappedVideos.filter(
      (v) => v.niche.toLowerCase() === n.tag.toLowerCase()
    ).length;
    return {
      id: n.id,
      tag: n.tag,
      videoCount: count,
    };
  });

  return {
    videos: mappedVideos,
    niches: mappedNiches,
  };
}

