"use client";

import React, { useState, useEffect, useRef } from "react";
import { NicheSidebar, type NicheItem } from "./niche-sidebar";
import { TheaterCanvas } from "./theater-canvas";
import { AnalyticsPanel } from "./analytics-panel";
import type { VideoItem } from "./feed-canvas";
import { toggleBookmarkAction, triggerIngestionAction } from "@/app/actions/curate";
import {
  type NicheGroupWithMembers,
  createNicheGroupAction,
  updateNicheGroupAction,
  deleteNicheGroupAction,
  triggerBatchGroupIngestionAction,
} from "@/app/actions/groups";
import { downloadMediaAction } from "@/app/actions/media";

interface FeedPageProps {
  initialVideos: VideoItem[];
  initialNiches: NicheItem[];
  initialGroups?: NicheGroupWithMembers[];
}

export function FeedPage({
  initialVideos,
  initialNiches,
  initialGroups = [],
}: FeedPageProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [niches, setNiches] = useState<NicheItem[]>(initialNiches);
  const [groups, setGroups] = useState<NicheGroupWithMembers[]>(initialGroups);

  // Group & multi-niche selection state
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroups[0]?.id || ""
  );

  const initialMemberNiches =
    initialGroups[0]?.memberNiches ||
    (initialNiches.length > 0 ? [initialNiches[0].tag] : []);

  const [selectedNiches, setSelectedNiches] = useState<string[]>(initialMemberNiches);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [region, setRegion] = useState<"US" | "UK" | "CA" | "AU">("US");

  // Ingestion discovery & media state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingNiche, setScrapingNiche] = useState<string | null>(null);
  const [isBatchIngesting, setIsBatchIngesting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Scheduler execution guard
  const isCheckingScheduleRef = useRef(false);

  // Unified Viral Ranking across all selected niches
  const filteredVideos = (
    selectedNiches.length > 0
      ? videos.filter((v) =>
          selectedNiches.some((n) => n.toLowerCase() === v.niche.toLowerCase())
        )
      : videos
  ).sort((a, b) => b.viralScore - a.viralScore);

  const currentVideo = filteredVideos[currentIndex] || filteredVideos[0];
  const savedCount = videos.filter((v) => v.isSaved).length;

  // ==========================================================================
  // In-App Background Scheduler: Checks group schedules every 60 seconds
  // ==========================================================================
  useEffect(() => {
    const checkSchedules = async () => {
      if (isCheckingScheduleRef.current || isBatchIngesting || isScraping) return;

      const now = new Date();
      const currentEpoch = Math.floor(now.getTime() / 1000);
      const currentHHMM = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      for (const group of groups) {
        if (!group.scheduleEnabled || group.memberNiches.length === 0) continue;

        let isDue = false;

        if (group.scheduleType === "daily") {
          // Check if time matches and wasn't run in the last 12 hours
          const lastRun = group.lastRunAt || 0;
          const twelveHoursSec = 12 * 3600;
          if (group.scheduleTime === currentHHMM && currentEpoch - lastRun > twelveHoursSec) {
            isDue = true;
          }
        } else if (group.scheduleType === "interval") {
          const intervalHours = parseFloat(group.scheduleTime) || 12;
          const intervalSec = intervalHours * 3600;
          const lastRun = group.lastRunAt || 0;
          if (currentEpoch - lastRun >= intervalSec) {
            isDue = true;
          }
        }

        if (isDue) {
          isCheckingScheduleRef.current = true;
          setToast({
            type: "info",
            message: `⏰ Scheduled trigger: running batch ingestion for "${group.name}"...`,
          });

          try {
            await handleTriggerBatchIngest(group.id, group.memberNiches);
          } finally {
            isCheckingScheduleRef.current = false;
          }
          break; // Process one group per tick
        }
      }
    };

    const timer = setInterval(checkSchedules, 60000);
    return () => clearInterval(timer);
  }, [groups, isBatchIngesting, isScraping]);

  // ==========================================================================
  // Group & Niche Selection Handlers
  // ==========================================================================

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    const targetGroup = groups.find((g) => g.id === groupId);
    if (targetGroup) {
      setSelectedNiches(targetGroup.memberNiches);
    }
    setCurrentIndex(0);
  };

  const handleToggleNiche = (nicheTag: string) => {
    const clean = nicheTag.toLowerCase().trim();
    setSelectedNiches((prev) => {
      if (prev.includes(clean)) {
        return prev.filter((t) => t !== clean);
      } else {
        return [...prev, clean];
      }
    });
    setCurrentIndex(0);
  };

  const handleSelectAllNiches = () => {
    const targetGroup = groups.find((g) => g.id === selectedGroupId);
    if (targetGroup && targetGroup.memberNiches.length > 0) {
      setSelectedNiches(targetGroup.memberNiches);
    } else {
      setSelectedNiches(niches.map((n) => n.tag.toLowerCase()));
    }
    setCurrentIndex(0);
  };

  const handleDeselectAllNiches = () => {
    setSelectedNiches([]);
    setCurrentIndex(0);
  };

  const handleCreateGroup = async (
    name: string,
    nicheTags: string[],
    scheduleEnabled?: boolean,
    scheduleType?: "daily" | "interval",
    scheduleTime?: string
  ) => {
    const res = await createNicheGroupAction({
      name,
      nicheTags,
      scheduleEnabled,
      scheduleType,
      scheduleTime,
    });

    if (res.success && res.group) {
      setGroups((prev) => [res.group!, ...prev]);
      setSelectedGroupId(res.group.id);
      setSelectedNiches(res.group.memberNiches);
      setCurrentIndex(0);
      setToast({
        type: "success",
        message: `Group "${name}" created with ${nicheTags.length} niches!`,
      });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({
        type: "error",
        message: res.message || "Failed to create group",
      });
    }
  };

  const handleUpdateGroupSchedule = async (
    groupId: string,
    scheduleEnabled: boolean,
    scheduleType: "daily" | "interval",
    scheduleTime: string
  ) => {
    const res = await updateNicheGroupAction({
      groupId,
      scheduleEnabled,
      scheduleType,
      scheduleTime,
    });

    if (res.success) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, scheduleEnabled, scheduleType, scheduleTime }
            : g
        )
      );
      setToast({
        type: "success",
        message: `Schedule updated for group!`,
      });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({
        type: "error",
        message: res.message || "Failed to update schedule",
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const res = await deleteNicheGroupAction(groupId);
    if (res.success) {
      const remaining = groups.filter((g) => g.id !== groupId);
      setGroups(remaining);
      if (remaining.length > 0) {
        setSelectedGroupId(remaining[0].id);
        setSelectedNiches(remaining[0].memberNiches);
      } else {
        setSelectedGroupId("");
        setSelectedNiches([]);
      }
      setCurrentIndex(0);
      setToast({
        type: "info",
        message: "Group deleted.",
      });
      setTimeout(() => setToast(null), 3000);
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

        if (!selectedNiches.includes(clean)) {
          setSelectedNiches((prev) => [...prev, clean]);
        }
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
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleTriggerBatchIngest = async (
    groupId?: string,
    targetNiches?: string[]
  ) => {
    const nichesToRun = targetNiches && targetNiches.length > 0 ? targetNiches : selectedNiches;
    if (nichesToRun.length === 0) return;

    setIsBatchIngesting(true);
    setToast({
      type: "info",
      message: `Starting batch ingestion across ${nichesToRun.length} niches (${region})...`,
    });

    try {
      const res = await triggerBatchGroupIngestionAction({
        groupId,
        nicheTags: nichesToRun,
        region,
        limit: 15,
      });

      if (res.success) {
        setToast({
          type: "success",
          message: res.message,
        });

        if (res.videos && res.videos.length > 0) {
          setVideos(res.videos);
        }
        if (res.niches && res.niches.length > 0) {
          setNiches(res.niches);
        }

        // Update group's lastRunAt in local state
        if (groupId) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId
                ? { ...g, lastRunAt: Math.floor(Date.now() / 1000) }
                : g
            )
          );
        }

        setCurrentIndex(0);
      } else {
        setToast({
          type: "error",
          message: res.message || "Batch ingestion failed.",
        });
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: err?.message || "Unexpected error during batch ingestion.",
      });
    } finally {
      setIsBatchIngesting(false);
      setTimeout(() => setToast(null), 6000);
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

      {/* 1. LEFT COLUMN: STREAM HUB & MULTI-NICHE FILTER ENGINE */}
      <NicheSidebar
        totalVideosCount={videos.length}
        niches={niches}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onUpdateGroupSchedule={handleUpdateGroupSchedule}
        onDeleteGroup={handleDeleteGroup}
        selectedNiches={selectedNiches}
        onToggleNiche={handleToggleNiche}
        onSelectAllNiches={handleSelectAllNiches}
        onDeselectAllNiches={handleDeselectAllNiches}
        onAddNiche={handleAddNiche}
        onTriggerScrape={handleTriggerScrape}
        onTriggerBatchIngest={handleTriggerBatchIngest}
        isScraping={isScraping}
        scrapingNiche={scrapingNiche}
        isBatchIngesting={isBatchIngesting}
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
