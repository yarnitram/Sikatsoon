import { FeedPage } from "@/components/feed-page";
import type { VideoItem } from "@/components/feed-canvas";
import type { NicheItem } from "@/components/niche-sidebar";
import { getNicheGroupsAction, type NicheGroupWithMembers } from "@/app/actions/groups";
import { db, videos, niches } from "@/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function FeedRoute() {
  let dbVideos: VideoItem[] = [];
  let dbNiches: NicheItem[] = [];
  let dbGroups: NicheGroupWithMembers[] = [];

  try {
    const rawVideos = await db.select().from(videos).orderBy(desc(videos.viralScore));
    dbVideos = rawVideos.map((v) => ({
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
      createdAt: v.createdAt,
      videoUrl: v.videoUrl,
      isSaved: Boolean(v.isSaved),
      localFilePath: v.localFilePath,
      downloadStatus: v.downloadStatus as any,
    }));

    const rawNiches = await db.select().from(niches);
    dbNiches = rawNiches.map((n) => {
      const count = dbVideos.filter(
        (v) => v.niche.toLowerCase() === n.tag.toLowerCase()
      ).length;
      return {
        id: n.id,
        tag: n.tag,
        videoCount: count,
      };
    });

    dbGroups = await getNicheGroupsAction();
  } catch (err) {
    console.error("Failed to query SQLite feed videos & groups:", err);
  }

  return (
    <FeedPage
      initialVideos={dbVideos}
      initialNiches={dbNiches}
      initialGroups={dbGroups}
    />
  );
}

