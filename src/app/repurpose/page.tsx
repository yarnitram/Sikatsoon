import { RepurposeClient } from "@/components/repurpose-client";
import type { RepurposeItem } from "@/components/repurpose-studio";
import { db, videos } from "@/db";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEMO_SAVED_ITEMS: RepurposeItem[] = [
  {
    id: "73829104859",
    authorUsername: "ecom_scaling",
    caption:
      "This 1 product generated $140k in 14 days without paid ads. Stop scrolling if you're still dropshipping from AliExpress. Full supplier breakdown 👇",
    viralScore: 96.8,
    videoUrl: "https://www.tiktok.com/@ecom_scaling/video/73829104859",
    downloadStatus: "DOWNLOADED",
    localFilePath: "storage/downloads/73829104859.mp4",
    transcriptionStatus: "COMPLETED",
    transcriptText:
      "Stop scrolling if you're still dropshipping from AliExpress in 2026. This single magnetic accessory did $140k in two weeks with zero paid ads. Here is the exact framework: First, we identified high-frequency search volume on TikTok Shop under desk organizers. Instead of overseas freight, we source direct from a local fulfillment center with a 3-day SLA guarantee. Comment BLUEPRINT and my bot will DM you the vetted supplier list and ad scripts. Don't forget to bookmark this before it gets saturated.",
  },
  {
    id: "73829104991",
    authorUsername: "growthhacker",
    caption:
      "If you have under 1,000 followers, stop posting 3x a day. Run this 17-minute pipeline instead to trigger algorithmic distribution.",
    viralScore: 94.2,
    videoUrl: "https://www.tiktok.com/@growthhacker/video/73829104991",
    downloadStatus: "DOWNLOADED",
    localFilePath: "storage/downloads/73829104991.mp4",
    transcriptionStatus: "IDLE",
    transcriptText: null,
  },
  {
    id: "73829105123",
    authorUsername: "techcurator",
    caption:
      "This automated coding workflow replaces 4 browser extensions you're paying $120/mo for. Here's how to install it locally.",
    viralScore: 91.5,
    videoUrl: "https://www.tiktok.com/@techcurator/video/73829105123",
    downloadStatus: "IDLE",
    localFilePath: null,
    transcriptionStatus: "IDLE",
    transcriptText: null,
  },
  {
    id: "73829105456",
    authorUsername: "fit_coach",
    caption:
      "Eat this exact 4-ingredient bowl 2 hours before training if you want instant vascularity and high workout endurance.",
    viralScore: 88.9,
    videoUrl: "https://www.tiktok.com/@fit_coach/video/73829105456",
    downloadStatus: "DOWNLOADED",
    localFilePath: "storage/downloads/73829105456.mp4",
    transcriptionStatus: "COMPLETED",
    transcriptText:
      "Eat this exact 4-ingredient bowl 2 hours before training if you want instant vascularity. 1 cup of white rice for fast glycogen, 1 tbsp raw honey, pink Himalayan salt for sodium pumps, and 50g of whey isolate. Track your lifts and you'll see a 15% strength bump within 2 weeks.",
  },
  {
    id: "73829105789",
    authorUsername: "saas_growth",
    caption:
      "We stopped doing cold outbound completely. Here is the $0 inbound lead loop generating 60 qualified demo calls every week.",
    viralScore: 93.1,
    videoUrl: "https://www.tiktok.com/@saas_growth/video/73829105789",
    downloadStatus: "DOWNLOADED",
    localFilePath: "storage/downloads/73829105789.mp4",
    transcriptionStatus: "COMPLETED",
    transcriptText:
      "We stopped doing cold outbound completely. Here is the $0 inbound lead loop generating 60 calls every week. We publish short-form video teardowns of popular SaaS landing pages, pinpoint their 2 biggest conversion leaks, and offer a free Loom teardown in the comments. Our close rate went from 8% to 34%.",
  },
];

export default async function RepurposeRoute() {
  let dbSavedItems: RepurposeItem[] = [];

  try {
    const rawSaved = await db
      .select()
      .from(videos)
      .where(eq(videos.isSaved, true))
      .orderBy(desc(videos.viralScore));

    if (rawSaved.length > 0) {
      dbSavedItems = rawSaved.map((v) => ({
        id: v.id,
        authorUsername: v.authorUsername,
        caption: v.caption || "",
        viralScore: v.viralScore,
        videoUrl: v.videoUrl,
        downloadStatus: v.downloadStatus as any,
        localFilePath: v.localFilePath,
        transcriptionStatus: v.transcriptionStatus as any,
        transcriptText: v.transcriptText,
      }));
    }
  } catch (err) {
    console.error("Failed to query SQLite saved videos:", err);
  }

  // If database has saved items, merge them ahead of demo items
  const finalItems =
    dbSavedItems.length > 0
      ? [
          ...dbSavedItems,
          ...DEMO_SAVED_ITEMS.filter((d) => !dbSavedItems.some((s) => s.id === d.id)),
        ]
      : DEMO_SAVED_ITEMS;

  return <RepurposeClient initialItems={finalItems} />;
}
