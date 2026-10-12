"use client";

import React, { useState, useEffect, useRef } from "react";
import type { VideoItem } from "./feed-canvas";

interface TheaterCanvasProps {
  currentVideo?: VideoItem;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleSave: (videoId: string) => Promise<void>;
  onDownloadVideo?: (videoId: string) => Promise<void>;
  isDownloading?: boolean;
}

export function TheaterCanvas({
  currentVideo,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onToggleSave,
  onDownloadVideo,
  isDownloading = false,
}: TheaterCanvasProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleSave = async () => {
    if (!currentVideo) return;
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);
    await onToggleSave(currentVideo.id);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowUp" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        toggleSave();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, currentVideo]);

  if (!currentVideo) {
    return (
      <main className="flex-1 flex items-center justify-center relative bg-surface-container-lowest p-4 overflow-hidden">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
            bolt
          </span>
          <p className="font-headline-sm text-sm font-semibold">Stream Hub Standing By</p>
          <p className="font-body-sm text-xs text-on-surface-variant/70 text-center max-w-xs">
            No live videos in this cluster yet. Type a #niche in the sidebar to scrape and index trending TikToks.
          </p>
        </div>
      </main>
    );
  }

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  };

  const hasLocalVideo = Boolean(
    currentVideo.localFilePath || currentVideo.downloadStatus === "DOWNLOADED"
  );

  return (
    <main className="flex-1 flex items-center justify-center relative bg-surface-container-lowest p-4 overflow-hidden select-none">
      {/* Background tactical telemetry & coordinate accents */}
      <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 opacity-40">
        <span className="font-data-badge text-xs text-tertiary">LATENCY: 42ms</span>
        <span className="text-on-surface-variant text-xs">/</span>
        <span className="font-data-badge text-xs text-on-surface-variant">NODE: US-EAST-VIRGINIA</span>
      </div>
      <div className="absolute bottom-4 left-6 pointer-events-none opacity-40">
        <span className="font-data-badge text-xs text-secondary">
          FEED_BURST_STABLE: 120 FPS PARSER
        </span>
      </div>

      {/* 9:16 Vertical Video Monitor Card */}
      <div className="h-[580px] w-[326px] max-h-[82vh] rounded-[24px] overflow-hidden relative bg-surface-container-high shadow-2xl flex flex-col justify-between group border border-surface-container-highest/50">
        {/* Visual Video Content / Hybrid Player Layer */}
        {hasLocalVideo ? (
          <video
            ref={videoRef}
            src={`/api/video/${currentVideo.id}`}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container to-surface-container-lowest flex flex-col items-center justify-center p-6 text-center z-0">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-primary-container/30 flex items-center justify-center mb-3 text-primary shadow-xl">
              <span className="material-symbols-outlined text-4xl">play_circle</span>
            </div>
            <span className="font-headline-sm text-sm text-on-surface font-bold mb-1">
              @{currentVideo.authorUsername}
            </span>
            <p className="font-body-sm text-xs text-on-surface-variant/80 line-clamp-3 mb-5 max-w-[240px]">
              {currentVideo.caption || "Trending viral TikTok clip"}
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
              {isDownloading ? (
                <div className="py-2.5 px-3 rounded-xl bg-primary-container/20 border border-primary-container/40 text-primary flex items-center justify-center gap-2 text-xs font-medium animate-pulse shadow-md">
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  <span>Downloading MP4 (~1.8s)...</span>
                </div>
              ) : (
                <button
                  onClick={() => onDownloadVideo?.(currentVideo.id)}
                  className="py-2.5 px-3.5 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary font-headline-sm text-xs font-semibold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download &amp; Play MP4</span>
                </button>
              )}

              <a
                href={currentVideo.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-body-sm text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-surface-container-highest/60"
              >
                <span>Open in TikTok</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          </div>
        )}

        {/* Gradient overlays for telemetry legibility */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-surface-container-lowest/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent pointer-events-none" />

        {/* Top Micro Header Inside Video Card */}
        <div className="relative z-10 p-3.5 flex items-center justify-between text-on-surface">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-data-badge text-[10px] tracking-wider font-bold uppercase shadow">
              BREAKOUT #{currentIndex + 1}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md text-tertiary font-data-badge text-[10px] flex items-center gap-1 border border-surface-container-high/40">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> 4K HD
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-7 h-7 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-primary transition-colors border border-surface-container-high/40"
              title={isMuted ? "Unmute" : "Mute"}
            >
              <span className="material-symbols-outlined text-sm">
                {isMuted ? "volume_off" : "volume_up"}
              </span>
            </button>
            <button
              onClick={() => {
                if (videoRef.current?.requestFullscreen) {
                  videoRef.current.requestFullscreen();
                }
              }}
              className="w-7 h-7 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-primary transition-colors border border-surface-container-high/40"
              title="Fullscreen"
            >
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </button>
          </div>
        </div>

        {/* Center subtle play/pause indicator */}
        <div className="relative z-10 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
        </div>

        {/* Bottom Overlays: Creator, Sound Wave Ticker, Scrubber */}
        <div className="relative z-10 p-3.5 flex flex-col gap-2">
          {/* Audio wave ticker badge */}
          <div className="inline-flex items-center gap-2 max-w-[240px] px-2.5 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-md border border-surface-container-high/40">
            <span className="material-symbols-outlined text-xs text-primary animate-pulse">
              music_note
            </span>
            <span className="font-body-sm text-xs text-on-surface truncate">
              ♫ original sound - #{currentVideo.niche} (trending)
            </span>
          </div>

          {/* Creator Handle + Caption snippet */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-sm font-bold text-on-surface drop-shadow-md">
                @{currentVideo.authorUsername}
              </span>
              <span className="material-symbols-outlined text-xs text-tertiary">
                verified
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface/90 line-clamp-2 drop-shadow leading-tight mt-0.5">
              {currentVideo.caption || "Discover how this creator engineered breakout velocity..."}
            </p>
          </div>

          {/* Scrub Bar with Crimson Indicator */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="w-full h-1 bg-surface-container-high/80 rounded-full overflow-hidden relative cursor-pointer">
              <div className="h-full bg-primary-container w-[42%] relative transition-all">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-on-surface shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between font-data-badge text-[10px] text-on-surface-variant">
              <span>00:18</span>
              <span>00:45</span>
            </div>
          </div>
        </div>

        {/* Floating Save / Heart Button Pill Pin on Right */}
        <div className="absolute bottom-28 right-3.5 z-20 flex flex-col items-center gap-1">
          <button
            onClick={toggleSave}
            id="likeBtn"
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all ${
              currentVideo.isSaved
                ? "bg-primary-container text-on-primary scale-105"
                : "bg-surface-container-lowest/80 backdrop-blur-md text-on-surface hover:text-primary hover:bg-surface-container"
            } ${isHeartAnimating ? "scale-125" : ""}`}
            title={currentVideo.isSaved ? "Saved to Repurpose Lab" : "Save video"}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: currentVideo.isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
          <span className="font-data-badge text-[10px] font-bold text-on-surface drop-shadow">
            {formatCount(currentVideo.likesCount)}
          </span>

          <button
            onClick={toggleSave}
            className={`w-9 h-9 mt-1 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-surface-container-high/40 ${
              currentVideo.isSaved
                ? "bg-primary-container/30 text-primary"
                : "bg-surface-container-lowest/80 text-on-surface hover:bg-surface-container"
            }`}
            title="Bookmark"
          >
            <span className="material-symbols-outlined text-base">bookmark</span>
          </button>
          <span className="font-data-badge text-[10px] text-on-surface drop-shadow">
            {formatCount(currentVideo.sharesCount)}
          </span>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(currentVideo.videoUrl);
              }
            }}
            className="w-9 h-9 mt-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors border border-surface-container-high/40"
            title="Share Video Link"
          >
            <span className="material-symbols-outlined text-base">share</span>
          </button>
        </div>
      </div>

      {/* Canvas Vertical Scroller Chevrons on Far Right */}
      <div className="absolute right-8 flex flex-col gap-3 z-30">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface hover:text-primary disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-lg transition-all active:scale-95 border border-surface-container-highest/60"
          title="Previous Video (K / Arrow Up)"
        >
          <span className="material-symbols-outlined text-lg">expand_less</span>
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex >= totalCount - 1}
          className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface hover:text-primary disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-lg transition-all active:scale-95 border border-surface-container-highest/60"
          title="Next Video (J / Arrow Down)"
        >
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </button>
      </div>
    </main>
  );
}
