"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Heart, ChevronUp, ChevronDown, Flame, Sparkles } from "lucide-react";

export interface VideoItem {
  id: string;
  authorUsername: string;
  region: "US" | "UK" | "CA" | "AU";
  niche: string;
  caption: string;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  viralScore: number;
  publishedAt: number;
  videoUrl: string;
  isSaved: boolean;
  localFilePath?: string | null;
  downloadStatus?: "IDLE" | "DOWNLOADING" | "DOWNLOADED" | "FAILED";
}

interface FeedCanvasProps {
  videos: VideoItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onToggleSave: (videoId: string) => Promise<void>;
}

export function FeedCanvas({
  videos,
  currentIndex,
  onIndexChange,
  onToggleSave,
}: FeedCanvasProps) {
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const currentVideo = videos[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, videos.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  // Keyboard navigation listener (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " " && currentVideo) {
        // Spacebar to toggle save
        e.preventDefault();
        triggerHeart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, currentVideo]);

  const triggerHeart = async () => {
    if (!currentVideo) return;
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 500);
    await onToggleSave(currentVideo.id);
  };

  if (!currentVideo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
        <Sparkles className="w-12 h-12 mb-3 text-neutral-600 animate-pulse" />
        <p className="text-base font-medium">No videos found</p>
        <p className="text-xs text-neutral-500 mt-1">
          Use the sidebar to fetch trending content by niche and region.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex items-center justify-center relative p-4 bg-neutral-950">
      {/* Vertical 9:16 Canvas Frame */}
      <div className="relative w-full max-w-[420px] aspect-[9/16] max-h-[calc(100vh-2rem)] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col">
        {/* TikTok Official Embed Player */}
        <div className="relative flex-1 w-full bg-black">
          <iframe
            key={currentVideo.id}
            src={`https://www.tiktok.com/embed/v2/${currentVideo.id}?lang=en-US`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Floating Quick Action Overlay */}
        <div className="absolute right-4 bottom-16 flex flex-col items-center gap-4 z-20">
          {/* Floating Heart Bookmark Button */}
          <button
            onClick={triggerHeart}
            title={currentVideo.isSaved ? "Saved to Repurpose Lab" : "Save video"}
            className={`p-3.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg ${
              currentVideo.isSaved
                ? "bg-red-500 text-white scale-105"
                : "bg-black/60 text-white hover:bg-black/80 hover:scale-110"
            } ${isHeartAnimating ? "scale-125" : ""}`}
          >
            <Heart
              className={`w-6 h-6 ${
                currentVideo.isSaved ? "fill-white" : "stroke-white"
              }`}
            />
          </button>
        </div>

        {/* Bottom Metadata Pill on Canvas */}
        <div className="absolute bottom-3 left-4 right-16 pointer-events-none z-20">
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white">
            <span className="font-semibold text-neutral-300">
              @{currentVideo.authorUsername}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {currentVideo.viralScore.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Navigation Chevrons */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5"
          title="Previous video (Arrow Up)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <span className="text-[11px] font-mono text-center text-neutral-400">
          {currentIndex + 1} / {videos.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex >= videos.length - 1}
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-white backdrop-blur-sm transition-transform hover:translate-y-0.5"
          title="Next video (Arrow Down)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
