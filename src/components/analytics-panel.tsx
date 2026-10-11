"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Zap,
  Percent,
  Download,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
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
    return formatNumber(v) + "/hr";
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

  const handleSend = async () => {
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
      <aside className="w-80 h-screen bg-neutral-900 border-l border-neutral-800 p-5 text-neutral-500 flex flex-col justify-center items-center text-center shrink-0">
        <Sparkles className="w-8 h-8 text-neutral-700 mb-2" />
        <p className="text-xs">Select a video to inspect analytics</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-screen bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between p-5 text-neutral-200 shrink-0">
      <div className="space-y-4">
        {/* Creator & Score Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Creator</p>
            <p className="font-bold text-sm text-white tracking-tight truncate max-w-[160px]">
              @{currentVideo.authorUsername}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>Score: {Math.round(currentVideo.viralScore)}</span>
          </div>
        </div>

        {/* 6-Grid Metrics Matrix */}
        <div>
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
            Performance Matrix
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Views */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Eye className="w-3 h-3" />
                <span>Views</span>
              </div>
              <div className="font-bold text-xs text-white">
                {formatNumber(currentVideo.viewsCount)}
              </div>
            </div>

            {/* Likes */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Likes</span>
              </div>
              <div className="font-bold text-xs text-white">
                {formatNumber(currentVideo.likesCount)}
              </div>
            </div>

            {/* Comments */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <MessageCircle className="w-3 h-3 text-sky-400" />
                <span>Comments</span>
              </div>
              <div className="font-bold text-xs text-white">
                {formatNumber(currentVideo.commentsCount)}
              </div>
            </div>

            {/* Shares */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span>Shares</span>
              </div>
              <div className="font-bold text-xs text-white">
                {formatNumber(currentVideo.sharesCount)}
              </div>
            </div>

            {/* Velocity */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Velocity</span>
              </div>
              <div className="font-bold text-xs text-white">
                {calculateVelocity(currentVideo.viewsCount, currentVideo.publishedAt)}
              </div>
            </div>

            {/* Engagement Ratio */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Percent className="w-3 h-3 text-violet-400" />
                <span>Eng. Ratio</span>
              </div>
              <div className="font-bold text-xs text-white">
                {calculateRatio(currentVideo)}
              </div>
            </div>
          </div>
        </div>

        {/* Hook & Transcript Preview */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Hook &amp; Transcript Preview
            </span>
            <button
              onClick={handleCopyHook}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Hook</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-mono line-clamp-4">
            &ldquo;{currentVideo.caption || "No hook detected."}&rdquo;
          </div>
        </div>

        {/* Send to Repurpose Action */}
        <div className="pt-2">
          <button
            onClick={handleSend}
            disabled={isSending}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all ${
              currentVideo.isSaved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
            }`}
          >
            {currentVideo.isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Bookmarked in Lab</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Send to Repurpose Lab</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Link to Repurpose Studio */}
      <div className="pt-3 border-t border-neutral-800">
        <Link
          href="/repurpose"
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>Repurpose Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
              {savedCount} Saved
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </aside>
  );
}
