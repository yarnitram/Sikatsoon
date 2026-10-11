"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { VideoItem } from "./feed-canvas";

interface AnalyticsPanelProps {
  currentVideo?: VideoItem;
  savedCount: number;
  onSendToRepurpose: (videoId: string) => Promise<void>;
}

export function AnalyticsPanel({
  currentVideo,
  savedCount,
  onSendToRepurpose,
}: AnalyticsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const calculateVelocity = (views: number, publishedAt: number) => {
    const hours = Math.max((Math.floor(Date.now() / 1000) - publishedAt) / 3600, 1);
    const v = Math.round(views / hours);
    return formatNumber(v) + " views/hr";
  };

  const calculateRatio = (v: VideoItem) => {
    const raw = (v.likesCount + 2 * v.commentsCount + 3 * v.sharesCount) / Math.max(v.viewsCount, 1);
    return (raw * 100).toFixed(1) + "%";
  };

  const handleCopyHook = () => {
    if (!currentVideo?.caption) return;
    navigator.clipboard.writeText(currentVideo.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSave = async () => {
    if (!currentVideo || isSending) return;
    setIsSending(true);
    try {
      await onSendToRepurpose(currentVideo.id);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentVideo) {
    return (
      <aside className="w-[340px] shrink-0 h-full bg-surface-container-lowest border-l border-surface-container-high/60 p-4 text-on-surface-variant flex flex-col justify-center items-center text-center">
        <span className="material-symbols-outlined text-3xl text-outline mb-2">
          query_stats
        </span>
        <p className="font-headline-sm text-xs">Select a video to inspect telemetry</p>
      </aside>
    );
  }

  const viralScoreRounded = Number(currentVideo.viralScore.toFixed(1));
  const isHighViral = viralScoreRounded >= 90;

  return (
    <aside className="w-[340px] shrink-0 h-full bg-surface-container-lowest flex flex-col justify-between p-4 border-l border-surface-container-high/60 shadow-2xl overflow-y-auto select-none">
      <div className="flex flex-col gap-3">
        {/* Creator Bar & Viral Score Pill */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container-high ring-2 ring-primary/40 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {currentVideo.authorUsername.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-xs font-bold text-on-surface truncate">
                  @{currentVideo.authorUsername}
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  #{currentVideo.niche} Creator · {currentVideo.region}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-surface-container-highest/50">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Region: <strong className="text-on-surface">{currentVideo.region}</strong>
            </span>
            {/* Glowing Viral Pill Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-data-badge text-[11px] font-bold ${
                isHighViral
                  ? "bg-secondary-container/20 text-secondary shadow-[0_0_12px_rgba(238,152,0,0.25)] border border-secondary/30"
                  : "bg-surface-container-high text-tertiary"
              }`}
            >
              <span>🔥</span>
              <span>Viral Score: {viralScoreRounded}</span>
            </div>
          </div>
        </div>

        {/* 2x2 Metric Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Views */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                Total Views
              </span>
              <span className="material-symbols-outlined text-sm">visibility</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-data-display text-sm font-bold text-on-surface">
                {formatNumber(currentVideo.viewsCount)}
              </span>
            </div>
            <span className="font-data-badge text-[10px] text-tertiary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">trending_up</span> +34.2%
            </span>
          </div>

          {/* Likes */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                Total Likes
              </span>
              <span className="material-symbols-outlined text-sm text-primary">favorite</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-data-display text-sm font-bold text-on-surface">
                {formatNumber(currentVideo.likesCount)}
              </span>
            </div>
            <span className="font-data-badge text-[10px] text-on-surface-variant">
              Ratio: {((currentVideo.likesCount / Math.max(currentVideo.viewsCount, 1)) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Comments */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                Comments
              </span>
              <span className="material-symbols-outlined text-sm">chat_bubble</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-data-display text-sm font-bold text-on-surface">
                {formatNumber(currentVideo.commentsCount)}
              </span>
            </div>
            <span className="font-data-badge text-[10px] text-tertiary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> High Conv
            </span>
          </div>

          {/* Shares */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                Shares
              </span>
              <span className="material-symbols-outlined text-sm text-secondary">share</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-data-display text-sm font-bold text-on-surface">
                {formatNumber(currentVideo.sharesCount)}
              </span>
            </div>
            <span className="font-data-badge text-[10px] text-primary-container font-semibold">
              Breakout x4
            </span>
          </div>
        </div>

        {/* Velocity Gauge Card */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Velocity Gauge
            </span>
            <span className="font-data-badge text-[11px] text-tertiary font-bold">
              {calculateVelocity(currentVideo.viewsCount, currentVideo.publishedAt)}
            </span>
          </div>

          {/* SVG Sparkline Path */}
          <div className="w-full h-8 relative overflow-hidden flex items-end">
            <svg className="w-full h-8 text-tertiary" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path
                d="M0,20 Q15,18 25,12 T50,14 T75,4 T100,2"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="M0,20 Q15,18 25,12 T50,14 T75,4 T100,2 L100,24 L0,24 Z"
                fill="currentColor"
                opacity="0.12"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60 font-body-sm text-[11px]">
            <span className="text-on-surface-variant">Engagement Ratio:</span>
            <span className="font-data-metric text-on-surface font-semibold">
              {calculateRatio(currentVideo)} (Viral Zone)
            </span>
          </div>
        </div>

        {/* Hook & Caption Inspector */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Extracted Hook &amp; Caption
            </span>
            <button
              onClick={handleCopyHook}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
              title="Copy hook text"
            >
              <span className="material-symbols-outlined text-xs">
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container text-on-surface font-body-sm text-xs leading-relaxed border-l-2 border-primary-container">
            &ldquo;{currentVideo.caption || "No hook text extracted."}&rdquo;
          </div>
        </div>
      </div>

      {/* Primary Action CTA Button: Repurposing Lab */}
      <div className="pt-3">
        <Link
          href="/repurpose"
          className="w-full py-2.5 px-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-xs font-semibold flex items-center justify-between transition-all group shadow-xl border border-surface-container-highest/60"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container group-hover:scale-125 transition-transform" />
            <span>Repurposing Lab ({savedCount} Saved)</span>
          </div>
          <span className="material-symbols-outlined text-base text-primary group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
    </aside>
  );
}
