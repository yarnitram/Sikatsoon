import { FeedPage } from "@/components/feed-page";
import type { VideoItem } from "@/components/feed-canvas";
import type { NicheItem } from "@/components/niche-sidebar";
import { getFeedDataAction } from "@/app/actions/curate";

export const dynamic = "force-dynamic";

export default async function FeedRoute() {
  let dbVideos: VideoItem[] = [];
  let dbNiches: NicheItem[] = [];

  try {
    const feedData = await getFeedDataAction();
    dbVideos = feedData.videos;
    dbNiches = feedData.niches;
  } catch (err) {
    console.error("Failed to query SQLite feed videos & niches:", err);
  }

  return (
    <FeedPage
      initialVideos={dbVideos}
      initialNiches={dbNiches}
    />
  );
}

