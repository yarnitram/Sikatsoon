"use client";

import React, { useState, useEffect } from "react";
import { NicheSidebar, type NicheItem } from "./niche-sidebar";
import { TheaterCanvas } from "./theater-canvas";
import { AnalyticsPanel } from "./analytics-panel";
import type { VideoItem } from "./feed-canvas";
import { toggleBookmarkAction, triggerIngestionAction } from "@/app/actions/curate";
import { downloadMediaAction } from "@/app/actions/media";
import {
  type TagFilterChip,
  type MatchMode,
  type DiscoveryPack,
  filterVideosByTags,
  cycleChipState,
} from "@/core/tag-filter";

interface FeedPageProps {
  initialVideos: VideoItem[];
  initialNiches: NicheItem[];
}

export function FeedPage({
  initialVideos,
  initialNiches,
}: FeedPageProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [niches, setNiches] = useState<NicheItem[]>(initialNiches);

  // Untpd Tag Filter Engine State
  const [chips, setChips] = useState<TagFilterChip[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>("ANY");
  const [customPacks, setCustomPacks] = useState<DiscoveryPack[]>([]);

  // Navigation & Geo Filter state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [region, setRegion] = useState<"US" | "UK" | "CA" | "AU">("US");

  // Ingestion discovery & media state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingNiche, setScrapingNiche] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Load custom discovery packs from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sikatsoon_custom_discovery_packs");
      if (stored) {
        setCustomPacks(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read custom packs from localStorage", e);
    }
  }, []);

  // Untpd Tag Query Engine Filtering & Unified Viral Ranking
  const { matchedVideos, yieldCount, excludedCount } = filterVideosByTags(
    videos,
    chips,
    matchMode
  );

  const currentVideo = matchedVideos[currentIndex] || matchedVideos[0];
  const savedCount = videos.filter((v) => v.isSaved).length;

  // ==========================================================================
  // Untpd Tag Chip Operations
  // ==========================================================================

  const handleAddChip = (rawTag: string, state: "include" | "exclude" = "include") => {
    const clean = rawTag.toLowerCase().trim().replace(/^#/, "");
    if (!clean) return;

    setChips((prev) => {
      const exists = prev.find((c) => c.tag.toLowerCase() === clean);
      if (exists) {
        // Toggle or keep
        return prev.map((c) => (c.tag.toLowerCase() === clean ? { ...c, state } : c));
      }
      return [...prev, { tag: clean, state }];
    });
    setCurrentIndex(0);
  };

  const handleCycleChip = (rawTag: string) => {
    const clean = rawTag.toLowerCase().trim().replace(/^#/, "");
    setChips((prev) => {
      const target = prev.find((c) => c.tag.toLowerCase() === clean);
      if (!target) return prev;

      const nextState = cycleChipState(target.state);
      if (nextState === null) {
        // Remove chip
        return prev.filter((c) => c.tag.toLowerCase() !== clean);
      }
      return prev.map((c) => (c.tag.toLowerCase() === clean ? { ...c, state: nextState } : c));
    });
    setCurrentIndex(0);
  };

  const handleRemoveChip = (rawTag: string) => {
    const clean = rawTag.toLowerCase().trim().replace(/^#/, "");
    setChips((prev) => prev.filter((c) => c.tag.toLowerCase() !== clean));
    setCurrentIndex(0);
  };

  const handleClearChips = () => {
    setChips([]);
    setCurrentIndex(0);
  };

  const handleSelectDiscoveryPack = (pack: DiscoveryPack) => {
    setChips(pack.chips);
    setCurrentIndex(0);
    setToast({
      type: "info",
      message: `⚡ Applied Discovery Pack: "${pack.name}" (${pack.chips.length} tags)`,
    });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveCustomPack = (name: string) => {
    if (chips.length === 0) return;
    const newPack: DiscoveryPack = {
      id: `pack-${Date.now()}`,
      name,
      chips: [...chips],
      isBuiltIn: false,
    };
    const updated = [...customPacks, newPack];
    setCustomPacks(updated);
    try {
      localStorage.setItem("sikatsoon_custom_discovery_packs", JSON.stringify(updated));
      setToast({
        type: "success",
        message: `Saved Discovery Pack "${name}"!`,
      });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.warn("Failed to persist custom pack to localStorage", e);
    }
  };

  const handleDeleteCustomPack = (packId: string) => {
    const updated = customPacks.filter((p) => p.id !== packId);
    setCustomPacks(updated);
    try {
      localStorage.setItem("sikatsoon_custom_discovery_packs", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist deletion to localStorage", e);
    }
  };

  // ==========================================================================
  // Media & Ingestion Actions
  // ==========================================================================

  const handleToggleSave = async (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, isSaved: !v.isSaved } : v))
    );

    try {
      await toggleBookmarkAction(videoId);
    } catch (err) {
      console.error("Failed to toggle bookmark on server", err);
    }
  };

  const handleTriggerScrape = async (targetTag: string): Promise<boolean> => {
    const clean = targetTag.toLowerCase().trim().replace(/^#/, "");
    if (!clean) return false;

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

        // Add to chips stack
        handleAddChip(clean, "include");
        return true;
      } else {
        setToast({
          type: "error",
          message: res.message || `Failed to ingest #${clean}. Check Apify token quota.`,
        });
        return false;
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: err?.message || "Unexpected network error during ingestion.",
      });
      return false;
    } finally {
      setIsScraping(false);
      setScrapingNiche(null);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDownloadVideo = async (videoId: string) => {
    setDownloadingId(videoId);
    setToast({
      type: "info",
      message: `Downloading watermark-free MP4 via yt-dlp...`,
    });

    try {
      const res = await downloadMediaAction(videoId);
      if (res.success) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  downloadStatus: "DOWNLOADED",
                  localFilePath: res.localFilePath,
                }
              : v
          )
        );
        setToast({
          type: "success",
          message: `✓ Video downloaded to local storage! Playing now.`,
        });
      } else {
        setToast({
          type: "error",
          message: res.message || "Failed to download video.",
        });
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: err?.message || "Unexpected download error.",
      });
    } finally {
      setDownloadingId(null);
      setTimeout(() => setToast(null), 5000);
    }
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

      {/* 1. LEFT COLUMN: UNTPD STREAM HUB & TAG-STACKING ENGINE */}
      <NicheSidebar
        totalVideosCount={videos.length}
        niches={niches}
        chips={chips}
        onAddChip={handleAddChip}
        onCycleChip={handleCycleChip}
        onRemoveChip={handleRemoveChip}
        onClearChips={handleClearChips}
        matchMode={matchMode}
        onMatchModeChange={(mode) => {
          setMatchMode(mode);
          setCurrentIndex(0);
        }}
        onSelectDiscoveryPack={handleSelectDiscoveryPack}
        customPacks={customPacks}
        onSaveCustomPack={handleSaveCustomPack}
        onDeleteCustomPack={handleDeleteCustomPack}
        yieldCount={yieldCount}
        excludedCount={excludedCount}
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
        totalCount={matchedVideos.length}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onNext={() =>
          setCurrentIndex((i) => Math.min(i + 1, matchedVideos.length - 1))
        }
        onToggleSave={handleToggleSave}
        onDownloadVideo={handleDownloadVideo}
        isDownloading={downloadingId === currentVideo?.id}
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
