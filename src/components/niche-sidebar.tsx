"use client";

import React, { useState } from "react";
import { Plus, Hash, Layers, Globe, Clock } from "lucide-react";

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
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddNiche(newTag.trim().replace(/^#/, ""));
      setNewTag("");
      setIsAdding(false);
    }
  };

  return (
    <aside className="w-72 h-screen bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between p-4 text-neutral-200 shrink-0">
      <div className="space-y-4">
        {/* App Title & Video Count Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
              S
            </div>
            <h1 className="font-bold text-sm tracking-tight text-white">Sikatsoon</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
              Lab
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>Library</span>
            </span>
            <span className="font-semibold text-neutral-200">
              Total: {totalVideosCount.toLocaleString()} Videos
            </span>
          </div>
        </div>

        {/* Add Niche Action */}
        <div>
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. dropshipping"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-rose-500 rounded-lg text-xs text-white focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 font-medium flex items-center justify-center gap-2 transition-all group"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-90 transition-transform" />
              <span>Add Niche</span>
            </button>
          )}
        </div>

        {/* Niche List */}
        <div>
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2 px-1">
            Curated Niches
          </label>
          <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
            {niches.map((niche) => {
              const isSelected = selectedNiche === niche.tag;
              return (
                <button
                  key={niche.id}
                  onClick={() => onSelectNiche(niche.tag)}
                  className={`w-full py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Hash className={`w-3.5 h-3.5 ${isSelected ? "text-rose-400" : "text-neutral-500"}`} />
                    <span className="truncate">{niche.tag}</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 pl-2">
                    {niche.videoCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls: Timeframe & Region Filters */}
      <div className="pt-3 border-t border-neutral-800 space-y-3">
        {/* Timeframe Selector */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
            <Clock className="w-3 h-3" />
            <span>Timeframe</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(["24h", "7d", "30d"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onTimeframeChange(t)}
                className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  timeframe === t
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Region Selector */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
            <Globe className="w-3 h-3" />
            <span>Region</span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(["US", "UK", "CA", "AU"] as const).map((r) => (
              <button
                key={r}
                onClick={() => onRegionChange(r)}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  region === r
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
