"use client";

import React, { useState } from "react";

export interface NicheItem {
  id: string;
  tag: string;
  videoCount: number;
}

interface NicheSidebarProps {
  totalVideosCount: number;
  niches: NicheItem[];
  selectedNiche: string;
  onSelectNiche: (nicheTag: string) => void;
  onAddNiche: (nicheTag: string) => void;
  timeframe: "24h" | "7d" | "30d";
  onTimeframeChange: (timeframe: "24h" | "7d" | "30d") => void;
  region: "US" | "UK" | "CA" | "AU";
  onRegionChange: (region: "US" | "UK" | "CA" | "AU") => void;
}

export function NicheSidebar({
  totalVideosCount,
  niches,
  selectedNiche,
  onSelectNiche,
  onAddNiche,
  timeframe,
  onTimeframeChange,
  region,
  onRegionChange,
}: NicheSidebarProps) {
  const [newTag, setNewTag] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddNiche(newTag.trim().replace(/^#/, ""));
      setNewTag("");
    }
  };

  const tagColors: Record<string, string> = {
    dropshipping: "text-secondary",
    "ai-tools": "text-tertiary",
    "fitness-gym": "text-outline",
    finance: "text-secondary-fixed",
    lifehacks: "text-primary",
  };

  return (
    <aside className="w-[280px] shrink-0 h-full bg-surface-container-lowest flex flex-col justify-between p-4 border-r border-surface-container-high/60 select-none relative z-20">
      <div className="flex flex-col gap-3">
        {/* Sub-header & indexing counter */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-sm">bolt</span>
            </span>
            <span className="font-headline-sm text-sm tracking-tight text-on-surface font-bold">
              Stream Hub
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high font-data-badge text-[11px] text-tertiary border border-surface-container-highest/60">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
            {totalVideosCount.toLocaleString()} idx
          </span>
        </div>

        {/* Search / Track tag form */}
        <form onSubmit={handleAddSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Track new #niche..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs pl-3 pr-8 py-2 rounded-lg outline-none focus:bg-surface-container border border-surface-container-high/60 focus:border-primary-container transition-all placeholder:text-on-surface-variant/50"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-variant transition-colors"
            title="Add Niche"
          >
            <span className="material-symbols-outlined text-xs">add</span>
          </button>
        </form>

        {/* Niches List */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider px-1 mb-1 font-semibold">
            Monitored Clusters
          </span>

          {/* All Niches Pill */}
          <button
            onClick={() => onSelectNiche("")}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all group ${
              !selectedNiche
                ? "bg-primary-container/20 text-on-surface border border-primary-container/30 shadow-sm"
                : "hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-sm ${
                  !selectedNiche ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                view_carousel
              </span>
              <span className="font-body-md text-xs font-medium text-on-surface">
                All Niches
              </span>
            </div>
            <span className="font-data-badge text-[11px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary">
              {totalVideosCount}
            </span>
          </button>

          {/* Individual Niches */}
          <div className="flex flex-col gap-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-0.5">
            {niches.map((niche) => {
              const isSelected = selectedNiche.toLowerCase() === niche.tag.toLowerCase();
              const hashColor = tagColors[niche.tag.toLowerCase()] || "text-secondary";

              return (
                <button
                  key={niche.id}
                  onClick={() => onSelectNiche(niche.tag)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all group ${
                    isSelected
                      ? "bg-primary-container/20 text-on-surface border border-primary-container/30 shadow-sm"
                      : "hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`font-data-badge text-xs ${hashColor}`}>#</span>
                    <span className="font-body-md text-xs truncate">{niche.tag}</span>
                  </div>
                  <span className="font-data-badge text-[11px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant group-hover:bg-surface-container">
                    {niche.videoCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Filters & Controls */}
      <div className="flex flex-col gap-3 pt-3 border-t border-surface-container-high/60">
        {/* Rolling Velocity Window */}
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider px-1 font-semibold">
            Rolling Velocity Window
          </span>
          <div className="grid grid-cols-3 p-1 rounded-lg bg-surface-container-low text-center gap-0.5 border border-surface-container-high/50">
            {(["24h", "7d", "30d"] as const).map((w) => (
              <button
                key={w}
                onClick={() => onTimeframeChange(w)}
                className={`py-1 rounded text-xs transition-colors ${
                  timeframe === w
                    ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Tier-1 Geo Selection */}
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider px-1 font-semibold">
            Geo Filter
          </span>
          <div className="grid grid-cols-4 gap-1 font-data-badge text-xs text-center">
            {(["US", "UK", "CA", "AU"] as const).map((r) => (
              <button
                key={r}
                onClick={() => onRegionChange(r)}
                className={`py-1 rounded transition-colors ${
                  region === r
                    ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Hotkey Legend */}
        <div className="p-2 rounded-lg bg-surface-container-low/60 border border-surface-container-high/40 flex items-center justify-between font-label-caps text-[10px] text-on-surface-variant">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-data-badge text-[10px]">
              J
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-data-badge text-[10px]">
              K
            </kbd>
            <span className="ml-1 text-xs">Prev/Next</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-data-badge text-[10px]">
              L
            </kbd>
            <span className="ml-1 text-xs">Save</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
