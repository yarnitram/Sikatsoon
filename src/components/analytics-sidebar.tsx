"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { VideoItem } from "./feed-canvas";

interface AnalyticsSidebarProps {
  currentVideo?: VideoItem;
  savedCount: number;
  onFetchTrending: (params: {
    niche: string;
    region: "US" | "UK" | "CA" | "AU";
    timeframe: "24h" | "7d" | "30d";
  }) => Promise<void>;
}

export function AnalyticsSidebar({
  currentVideo,
  savedCount,
  onFetchTrending,
}: AnalyticsSidebarProps) {
  const [niche, setNiche] = useState("ai productivity");
  const [region, setRegion] = useState<"US" | "UK" | "CA" | "AU">("US");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [isFetching, setIsFetching] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim() || isFetching) return;
    setIsFetching(true);
    try {
      await onFetchTrending({ niche: niche.trim(), region, timeframe });
    } finally {
      setIsFetching(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const timeAgo = (timestampSeconds: number) => {
    const diff = Math.floor(Date.now() / 1000) - timestampSeconds;
    const hours = Math.floor(diff / 3600);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <aside className="w-96 h-screen bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between p-5 text-neutral-200">
      {/* Top Header & Search Filters */}
      <div className="space-y-5">
        {/* App Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-md">
              S
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white">
                Sikatsoon
              </h1>
              <p className="text-[11px] text-neutral-400">Viral Curator Lab</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            v1.0 Local
          </span>
        </div>

        {/* Niche Input Form */}
        <form onSubmit={handleFetch} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Enter niche or tag..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Region Toggle Buttons */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Region
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(["US", "UK", "CA", "AU"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    region === r
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Segmented Control */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Timeframe
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[
                { label: "Daily (24h)", val: "24h" as const },
                { label: "Weekly (7d)", val: "7d" as const },
                { label: "Monthly (30d)", val: "30d" as const },
              ].map((t) => (
                <button
                  type="button"
                  key={t.val}
                  onClick={() => setTimeframe(t.val)}
                  className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                    timeframe === t.val
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fetch CTA Button */}
          <button
            type="submit"
            disabled={isFetching}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isFetching ? (
              <span className="animate-pulse">Curating Viral Stream...</span>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                Fetch Trending Videos
              </>
            )}
          </button>
        </form>

        {/* Current Video Analytics Card */}
        {currentVideo && (
          <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Author</p>
                <p className="font-semibold text-sm text-white">
                  @{currentVideo.authorUsername}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {currentVideo.viralScore.toFixed(1)}
                </span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Viral Score</p>
              </div>
            </div>

            {currentVideo.caption && (
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                {currentVideo.caption}
              </p>
            )}

            {/* Metrics 4-grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Views</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatNumber(currentVideo.viewsCount)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Likes</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatNumber(currentVideo.likesCount)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Comments (2x)</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatNumber(currentVideo.commentsCount)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shares (3x)</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatNumber(currentVideo.sharesCount)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {timeAgo(currentVideo.publishedAt)}
              </span>
              <span className="font-mono uppercase bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">
                {currentVideo.region} • #{currentVideo.niche}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA to /repurpose */}
      <div className="pt-4 border-t border-neutral-800">
        <Link
          href="/repurpose"
          className="w-full py-3 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-medium text-xs flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span>Repurpose Studio</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[11px]">
              {savedCount} Saved
            </span>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </aside>
  );
}
