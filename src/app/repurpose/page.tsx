"use client";

import { useState } from "react";
import { RepurposeStudio, type RepurposeItem } from "@/components/repurpose-studio";
import { downloadMediaAction, transcribeMediaAction } from "@/app/actions/media";

const INITIAL_SAVED_ITEMS: RepurposeItem[] = [
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

export default function RepurposeRoute() {
  const [items, setItems] = useState<RepurposeItem[]>(INITIAL_SAVED_ITEMS);

  const handleDownload = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, downloadStatus: "DOWNLOADING" } : i))
    );
    try {
      const res = await downloadMediaAction(id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, downloadStatus: res.success ? "DOWNLOADED" : "FAILED", localFilePath: res.localFilePath }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, downloadStatus: "FAILED" } : i))
      );
    }
  };

  const handleTranscribe = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, transcriptionStatus: "PROCESSING" } : i))
    );
    try {
      const res = await transcribeMediaAction(id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                transcriptionStatus: res.success ? "COMPLETED" : "FAILED",
                transcriptText: res.transcriptText,
              }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, transcriptionStatus: "FAILED" } : i))
      );
    }
  };

  return (
    <RepurposeStudio
      items={items}
      onDownload={handleDownload}
      onTranscribe={handleTranscribe}
    />
  );
}
