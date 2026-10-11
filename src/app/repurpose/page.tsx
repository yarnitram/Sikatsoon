"use client";

import { useState } from "react";
import { RepurposeStudio, type RepurposeItem } from "@/components/repurpose-studio";
import { downloadMediaAction, transcribeMediaAction } from "@/app/actions/media";

const INITIAL_SAVED_ITEMS: RepurposeItem[] = [
  {
    id: "73829104859",
    authorUsername: "ecommerce_ninja",
    caption:
      "POV: You found the #1 winning product that generated $42k in 3 days with zero ad spend...",
    viralScore: 94.2,
    videoUrl: "https://www.tiktok.com/@ecommerce_ninja/video/73829104859",
    downloadStatus: "DOWNLOADED",
    localFilePath: "storage/downloads/73829104859.mp4",
    transcriptionStatus: "COMPLETED",
    transcriptText:
      "POV: You found the #1 winning product that generated $42k in 3 days. Everyone is selling posture correctors, but look at this ultrasonic jewelry cleaner. The supplier has 5-day shipping and the profit margin is 72%.",
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
