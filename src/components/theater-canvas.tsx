"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Heart, ChevronUp, ChevronDown, Flame, Sparkles } from "lucide-react";
import type { VideoItem } from "./feed-canvas";

interface TheaterCanvasProps {
  currentVideo?: VideoItem;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleSave: (videoId: string) => Promise<void>;
}

export function TheaterCanvas({
  currentVideo,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onToggleSave,
}: TheaterCanvasProps) {
  const [isHeartPulsing, setIsHeartPulsing] = useState(false);

  const triggerHeart = async () => {
    if (!currentVideo) return;
    setIsHeartPulsing(true);
    setTimeout(() => setIsHeartPulsing(false), 400);
    await onToggleSave(currentVideo.id);
  };

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onPrev();
      } else if (e.key === " " && currentVideo) {
        e.preventDefault();
        triggerHeart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, currentVideo]);

  if (!currentVideo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 bg-neutral-950">
        <Sparkles className="w-10 h-10 mb-3 text-neutral-700 animate-pulse" />
        <p className="text-sm font-medium text-neutral-400">No videos in this niche</p>
        <p className="text-xs text-neutral-600 mt-1">Select another niche or fetch trending clips.</p>
      </div>
    );
  }

  return (
    <section className="flex-1 h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top Prev Control Button */}
      <div className="mb-3 z-20">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="py-1.5 px-5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none text-xs font-semibold text-neutral-300 border border-neutral-800 flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md hover:-translate-y-0.5"
          title="Previous Video (Arrow Up / K)"
        >
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          <span>Prev</span>
        </button>
      </div>

      {/* 9:16 Video Frame Container */}
      <div className="relative w-full max-w-[390px] aspect-[9/16] max-h-[calc(100vh-140px)] bg-neutral-900 rounded-[28px] overflow-hidden shadow-2xl border border-neutral-800 flex flex-col group">
        {/* TikTok Official Player Iframe */}
        <div className="relative flex-1 w-full bg-black">
          <iframe
            key={currentVideo.id}
            src={`https://www.tiktok.com/embed/v2/${currentVideo.id}?lang=en-US`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Floating Heart Bookmark Button */}
        <button
          onClick={triggerHeart}
          className={`absolute right-4 bottom-14 z-30 w-12 h-12 rounded-full backdrop-blur-md transition-all duration-200 shadow-xl flex items-center justify-center ${
            currentVideo.isSaved
              ? "bg-rose-500 text-white scale-105 border border-rose-400/50"
              : "bg-black/70 text-white border border-white/20 hover:scale-110"
          } ${isHeartPulsing ? "scale-125" : ""}`}
          title={currentVideo.isSaved ? "Saved to Repurpose Lab" : "Save video"}
        >
          <Heart
            className={`w-5 h-5 ${
              currentVideo.isSaved ? "fill-white text-white" : "text-white"
            }`}
          />
        </button>

        {/* Bottom Floating Author Pill on Canvas */}
        <div className="absolute bottom-3 left-4 right-16 pointer-events-none z-20">
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white">
            <span className="font-semibold text-neutral-300 truncate max-w-[150px]">
              @{currentVideo.authorUsername}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
              <Flame className="w-3 h-3 fill-amber-400" />
              {currentVideo.viralScore.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Next Control Button & Counter */}
      <div className="mt-3 flex items-center gap-3 z-20">
        <button
          onClick={onNext}
          disabled={currentIndex >= totalCount - 1}
          className="py-1.5 px-5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none text-xs font-semibold text-neutral-300 border border-neutral-800 flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md hover:translate-y-0.5"
          title="Next Video (Arrow Down / J)"
        >
          <span>Next</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>
        <span className="text-[11px] font-mono text-neutral-500">
          {currentIndex + 1} of {totalCount}
        </span>
      </div>
    </section>
  );
}
