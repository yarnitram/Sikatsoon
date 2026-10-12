"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, nicheGroups, nicheGroupMembers, niches, videos } from "@/db";
import { eq, inArray, desc } from "drizzle-orm";
import { ApifyTikTokAdapter } from "@/ingestion/apify-adapter";
import { mediaService } from "@/services/media-service";
import { getFeedDataAction, type FeedVideoItem, type NicheSummaryItem } from "./curate";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface NicheGroupWithMembers {
  id: string;
  name: string;
  scheduleEnabled: boolean;
  scheduleType: "daily" | "interval";
  scheduleTime: string;
  lastRunAt: number | null;
  memberNiches: string[];
  createdAt: number;
}

export interface BatchIngestionResult {
  success: boolean;
  groupId?: string;
  totalInserted: number;
  totalDownloaded: number;
  nicheResults: {
    niche: string;
    inserted: number;
    downloaded: number;
    error?: string;
  }[];
  message: string;
  videos?: FeedVideoItem[];
  niches?: NicheSummaryItem[];
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const CreateGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters").max(50),
  nicheTags: z.array(z.string().min(2).max(50)).min(1, "Select at least 1 niche"),
  scheduleEnabled: z.boolean().default(false),
  scheduleType: z.enum(["daily", "interval"]).default("daily"),
  scheduleTime: z.string().default("08:00"),
});

const UpdateGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  name: z.string().min(2).max(50).optional(),
  nicheTags: z.array(z.string().min(2).max(50)).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleType: z.enum(["daily", "interval"]).optional(),
  scheduleTime: z.string().optional(),
});

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Fetch all Niche Groups with their member niches.
 * Auto-seeds default "Tech & AI" group if none exist.
 */
export async function getNicheGroupsAction(): Promise<NicheGroupWithMembers[]> {
  try {
    const rawGroups = await db.select().from(nicheGroups).orderBy(desc(nicheGroups.createdAt));

    // Auto-seed initial group if empty
    if (rawGroups.length === 0) {
      const defaultGroupId = "tech-ai";
      await db.insert(nicheGroups).values({
        id: defaultGroupId,
        name: "Tech & AI",
        scheduleEnabled: false,
        scheduleType: "daily",
        scheduleTime: "08:00",
      });

      // Ensure 'ai-tools' niche tag is associated
      await db.insert(nicheGroupMembers).values({
        id: `${defaultGroupId}_ai-tools`,
        groupId: defaultGroupId,
        nicheTag: "ai-tools",
      });

      return [
        {
          id: defaultGroupId,
          name: "Tech & AI",
          scheduleEnabled: false,
          scheduleType: "daily",
          scheduleTime: "08:00",
          lastRunAt: null,
          memberNiches: ["ai-tools"],
          createdAt: Math.floor(Date.now() / 1000),
        },
      ];
    }

    const groupIds = rawGroups.map((g) => g.id);
    const members = await db
      .select()
      .from(nicheGroupMembers)
      .where(inArray(nicheGroupMembers.groupId, groupIds));

    return rawGroups.map((group) => {
      const memberNiches = members
        .filter((m) => m.groupId === group.id)
        .map((m) => m.nicheTag);

      return {
        id: group.id,
        name: group.name,
        scheduleEnabled: Boolean(group.scheduleEnabled),
        scheduleType: (group.scheduleType as "daily" | "interval") || "daily",
        scheduleTime: group.scheduleTime || "08:00",
        lastRunAt: group.lastRunAt,
        memberNiches,
        createdAt: group.createdAt,
      };
    });
  } catch (error) {
    console.error("Failed to fetch niche groups:", error);
    return [];
  }
}

/**
 * Create a new Niche Group with member niches and schedule settings.
 */
export async function createNicheGroupAction(
  rawInput: z.infer<typeof CreateGroupSchema>
): Promise<{ success: boolean; group?: NicheGroupWithMembers; message: string }> {
  const parsed = CreateGroupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { name, nicheTags, scheduleEnabled, scheduleType, scheduleTime } = parsed.data;

  // Clean tags
  const cleanTags = Array.from(
    new Set(nicheTags.map((t) => t.toLowerCase().trim().replace(/^#/, "")))
  ).filter(Boolean);

  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `group-${Date.now()}`;
  const groupId = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    // 1. Insert Group Record
    await db.insert(nicheGroups).values({
      id: groupId,
      name,
      scheduleEnabled,
      scheduleType,
      scheduleTime,
    });

    // 2. Insert Member Niches and ensure niches exist in `niches` table
    for (const tag of cleanTags) {
      await db
        .insert(niches)
        .values({
          id: tag,
          tag,
          displayName: tag.toUpperCase(),
        })
        .onConflictDoNothing();

      await db
        .insert(nicheGroupMembers)
        .values({
          id: `${groupId}_${tag}`,
          groupId,
          nicheTag: tag,
        })
        .onConflictDoNothing();
    }

    revalidatePath("/feed");

    const createdGroup: NicheGroupWithMembers = {
      id: groupId,
      name,
      scheduleEnabled,
      scheduleType,
      scheduleTime,
      lastRunAt: null,
      memberNiches: cleanTags,
      createdAt: Math.floor(Date.now() / 1000),
    };

    return {
      success: true,
      group: createdGroup,
      message: `Group "${name}" created with ${cleanTags.length} niches!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to create niche group",
    };
  }
}

/**
 * Update an existing Niche Group's settings, schedule, or member niches.
 */
export async function updateNicheGroupAction(
  rawInput: z.infer<typeof UpdateGroupSchema>
): Promise<{ success: boolean; message: string }> {
  const parsed = UpdateGroupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { groupId, name, nicheTags, scheduleEnabled, scheduleType, scheduleTime } = parsed.data;

  try {
    const updateData: Partial<typeof nicheGroups.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (scheduleEnabled !== undefined) updateData.scheduleEnabled = scheduleEnabled;
    if (scheduleType !== undefined) updateData.scheduleType = scheduleType;
    if (scheduleTime !== undefined) updateData.scheduleTime = scheduleTime;

    if (Object.keys(updateData).length > 0) {
      await db.update(nicheGroups).set(updateData).where(eq(nicheGroups.id, groupId));
    }

    // Update members if provided
    if (nicheTags !== undefined) {
      const cleanTags = Array.from(
        new Set(nicheTags.map((t) => t.toLowerCase().trim().replace(/^#/, "")))
      ).filter(Boolean);

      // Remove existing members
      await db.delete(nicheGroupMembers).where(eq(nicheGroupMembers.groupId, groupId));

      // Re-insert members
      for (const tag of cleanTags) {
        await db
          .insert(niches)
          .values({
            id: tag,
            tag,
            displayName: tag.toUpperCase(),
          })
          .onConflictDoNothing();

        await db
          .insert(nicheGroupMembers)
          .values({
            id: `${groupId}_${tag}`,
            groupId,
            nicheTag: tag,
          })
          .onConflictDoNothing();
      }
    }

    revalidatePath("/feed");

    return {
      success: true,
      message: "Group settings updated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to update niche group",
    };
  }
}

/**
 * Delete a Niche Group.
 */
export async function deleteNicheGroupAction(groupId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db.delete(nicheGroups).where(eq(nicheGroups.id, groupId));
    revalidatePath("/feed");
    return {
      success: true,
      message: "Group deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to delete group",
    };
  }
}

/**
 * Sequentially triggers ingestion for all member niches in a group (or a custom list of niches),
 * auto-downloads the top 3 breakout clips per niche, and records execution timestamp.
 */
export async function triggerBatchGroupIngestionAction({
  groupId,
  nicheTags,
  region = "US",
  limit = 15,
}: {
  groupId?: string;
  nicheTags: string[];
  region?: "US" | "UK" | "CA" | "AU";
  limit?: number;
}): Promise<BatchIngestionResult> {
  const cleanTags = Array.from(
    new Set(nicheTags.map((t) => t.toLowerCase().trim().replace(/^#/, "")))
  ).filter(Boolean);

  if (cleanTags.length === 0) {
    return {
      success: false,
      totalInserted: 0,
      totalDownloaded: 0,
      nicheResults: [],
      message: "No valid niches provided for batch ingestion",
    };
  }

  let totalInserted = 0;
  let totalDownloaded = 0;
  const nicheResults: BatchIngestionResult["nicheResults"] = [];

  const adapter = new ApifyTikTokAdapter();

  for (const niche of cleanTags) {
    try {
      const rawVideos = await adapter.fetchTrending({ niche, region, limit });
      const scoredVideos = adapter.processAndScore(rawVideos);

      let nicheInserted = 0;
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
        nicheInserted++;
      }

      // Ensure registered in niches table
      await db
        .insert(niches)
        .values({
          id: niche,
          tag: niche,
          displayName: niche.toUpperCase(),
        })
        .onConflictDoNothing();

      // Auto-download top 3 breakout clips
      let nicheDownloaded = 0;
      const topBreakouts = scoredVideos.slice(0, 3);
      for (const topVideo of topBreakouts) {
        try {
          const localPath = await mediaService.downloadVideo(topVideo.id, topVideo.videoUrl);
          await db
            .update(videos)
            .set({ localFilePath: localPath, downloadStatus: "DOWNLOADED" })
            .where(eq(videos.id, topVideo.id));
          nicheDownloaded++;
        } catch (dlErr) {
          console.warn(`[Batch] Could not auto-download clip ${topVideo.id}:`, dlErr);
        }
      }

      totalInserted += nicheInserted;
      totalDownloaded += nicheDownloaded;

      nicheResults.push({
        niche,
        inserted: nicheInserted,
        downloaded: nicheDownloaded,
      });
    } catch (nicheErr: any) {
      console.error(`[Batch] Failed to ingest niche #${niche}:`, nicheErr);
      nicheResults.push({
        niche,
        inserted: 0,
        downloaded: 0,
        error: nicheErr?.message || "Ingestion failed",
      });
    }
  }

  // Update lastRunAt on the group if groupId provided
  if (groupId) {
    try {
      await db
        .update(nicheGroups)
        .set({ lastRunAt: Math.floor(Date.now() / 1000) })
        .where(eq(nicheGroups.id, groupId));
    } catch (groupUpdateErr) {
      console.warn("Could not update lastRunAt on group:", groupUpdateErr);
    }
  }

  revalidatePath("/feed");
  revalidatePath("/repurpose");

  const feedData = await getFeedDataAction();

  return {
    success: totalInserted > 0,
    groupId,
    totalInserted,
    totalDownloaded,
    nicheResults,
    message: `Batch completed: ${totalInserted} videos indexed across ${cleanTags.length} niches (${totalDownloaded} MP4s downloaded)!`,
    videos: feedData.videos,
    niches: feedData.niches,
  };
}
