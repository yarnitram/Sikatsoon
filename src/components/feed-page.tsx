"use client";

import React, { useState } from "react";
import { NicheSidebar, type NicheItem } from "./niche-sidebar";
import { TheaterCanvas } from "./theater-canvas";
import { AnalyticsPanel } from "./analytics-panel";
import type { VideoItem } from "./feed-canvas";
import { toggleBookmarkAction } from "@/app/actions/curate";

interface FeedPageProps {
  initialVideos: VideoItem[];
  initialNiches: NicheItem[];
}

export function FeedPage({ initialVideos, initialNiches }: FeedPageProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [niches, setNiches] = useState<NicheItem[]>(initialNiches);
  const [selectedNiche, setSelectedNiche] = useState<string>(
    initialNiches[0]?.tag || "ai-tools"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [region, setRegion] = useState<"US" | "UK" | "CA" | "AU">("US");

  const filteredVideos = videos.filter((v) =>
    selectedNiche ? v.niche.toLowerCase() === selectedNiche.toLowerCase() : true
  );

  const currentVideo = filteredVideos[currentIndex] || filteredVideos[0];
  const savedCount = videos.filter((v) => v.isSaved).length;

  const handleToggleSave = async (videoId: string) => {
    // Optimistic UI update
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, isSaved: !v.isSaved } : v))
    );

    try {
      await toggleBookmarkAction(videoId);
    } catch (err) {
      console.error("Failed to toggle bookmark on server", err);
    }
  };

  const handleAddNiche = (tag: string) => {
    const clean = tag.toLowerCase().trim();
    if (!niches.some((n) => n.tag === clean)) {
      setNiches((prev) => [...prev, { id: String(Date.now()), tag: clean, videoCount: 0 }]);
      setSelectedNiche(clean);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full overflow-hidden flex bg-surface select-none">
      {/* 1. LEFT COLUMN: STREAM HUB & FILTER ENGINE */}
      <NicheSidebar
        totalVideosCount={videos.length}
        niches={niches}
        selectedNiche={selectedNiche}
        onSelectNiche={(tag) => {
          setSelectedNiche(tag);
          setCurrentIndex(0);
        }}
        onAddNiche={handleAddNiche}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        region={region}
        onRegionChange={setRegion}
      />

      {/* 2. CENTER COLUMN: THEATER CANVAS (9:16 Vertical Monitor) */}
      <TheaterCanvas
        currentVideo={currentVideo}
        currentIndex={currentIndex}
        totalCount={filteredVideos.length}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onNext={() =>
          setCurrentIndex((i) => Math.min(i + 1, filteredVideos.length - 1))
        }
        onToggleSave={handleToggleSave}
      />

      {/* 3. RIGHT COLUMN: TELEMETRY & REPURPOSE CTA */}
      <AnalyticsPanel
        currentVideo={currentVideo}
        savedCount={savedCount}
        onSendToRepurpose={handleToggleSave}
      />
    </div>
  );
}
