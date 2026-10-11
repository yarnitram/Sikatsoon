"use client";

import React, { useState } from "react";
import { NicheSidebar, type NicheItem } from "./niche-sidebar";
import { TheaterCanvas } from "./theater-canvas";
import { AnalyticsPanel } from "./analytics-panel";
import type { VideoItem } from "./feed-canvas";
import { toggleBookmarkAction, triggerIngestionAction } from "@/app/actions/curate";

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

  // Ingestion discovery state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingNiche, setScrapingNiche] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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

  const handleTriggerScrape = async (targetTag: string) => {
    const clean = targetTag.toLowerCase().trim().replace(/^#/, "");
    if (!clean) return;

    setIsScraping(true);
    setScrapingNiche(clean);
    setToast({
      type: "info",
      message: `Connecting to Apify Actor to ingest #${clean} (${region})...`,
    });

    try {
      const res = await triggerIngestionAction({
        niche: clean,
        region,
        timeframe,
        limit: 15,
      });

      if (res.success) {
        setToast({
          type: "success",
          message: res.message || `Discovered ${res.insertedCount} viral videos for #${clean}!`,
        });

        if (res.videos && res.videos.length > 0) {
          setVideos(res.videos);
        }
        if (res.niches && res.niches.length > 0) {
          setNiches(res.niches);
        }

        setSelectedNiche(clean);
        setCurrentIndex(0);
      } else {
        setToast({
          type: "error",
          message: res.message || `Failed to ingest #${clean}. Check Apify token quota.`,
        });
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: err?.message || "Unexpected network error during ingestion.",
      });
    } finally {
      setIsScraping(false);
      setScrapingNiche(null);
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleAddNiche = (tag: string) => {
    handleTriggerScrape(tag);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full overflow-hidden flex bg-surface select-none relative">
      {/* Dynamic Status Toast Banner */}
      {toast && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border text-xs font-body-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-surface-container-high/95 border-tertiary/40 text-tertiary shadow-tertiary/5"
              : toast.type === "error"
              ? "bg-surface-container-high/95 border-error/40 text-error shadow-error/5"
              : "bg-surface-container-high/95 border-primary/40 text-primary shadow-primary/5"
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {toast.type === "success"
              ? "check_circle"
              : toast.type === "error"
              ? "error"
              : "progress_activity"}
          </span>
          <span className="font-medium text-on-surface">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-on-surface-variant hover:text-on-surface p-0.5 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

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
        onTriggerScrape={handleTriggerScrape}
        isScraping={isScraping}
        scrapingNiche={scrapingNiche}
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
