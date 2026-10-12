"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  type TagFilterChip,
  type MatchMode,
  type DiscoveryPack,
  BUILT_IN_DISCOVERY_PACKS,
} from "@/core/tag-filter";
import { POPULAR_VIRAL_NICHES } from "@/core/niche-catalog";

export interface NicheItem {
  id: string;
  tag: string;
  videoCount: number;
}

interface NicheSidebarProps {
  totalVideosCount: number;
  niches: NicheItem[];
  chips: TagFilterChip[];
  onAddChip: (tag: string, state?: "include" | "exclude") => void;
  onCycleChip: (tag: string) => void;
  onRemoveChip: (tag: string) => void;
  onClearChips: () => void;
  matchMode: MatchMode;
  onMatchModeChange: (mode: MatchMode) => void;
  onSelectDiscoveryPack: (pack: DiscoveryPack) => void;
  customPacks?: DiscoveryPack[];
  onSaveCustomPack?: (name: string) => void;
  onDeleteCustomPack?: (packId: string) => void;

  yieldCount: number;
  excludedCount: number;

  onTriggerScrape?: (nicheTag: string) => Promise<boolean | void>;
  isScraping?: boolean;
  scrapingNiche?: string | null;

  timeframe: "24h" | "7d" | "30d";
  onTimeframeChange: (timeframe: "24h" | "7d" | "30d") => void;
  region: "US" | "UK" | "CA" | "AU";
  onRegionChange: (region: "US" | "UK" | "CA" | "AU") => void;
}

export function NicheSidebar({
  totalVideosCount,
  niches,
  chips,
  onAddChip,
  onCycleChip,
  onRemoveChip,
  onClearChips,
  matchMode,
  onMatchModeChange,
  onSelectDiscoveryPack,
  customPacks = [],
  onSaveCustomPack,
  onDeleteCustomPack,
  yieldCount,
  excludedCount,
  onTriggerScrape,
  isScraping = false,
  scrapingNiche = null,
  timeframe,
  onTimeframeChange,
  region,
  onRegionChange,
}: NicheSidebarProps) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSavePackModalOpen, setIsSavePackModalOpen] = useState(false);
  const [customPackName, setCustomPackName] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cleanQuery = query.trim().toLowerCase().replace(/^#/, "");

  // Autocomplete suggestions based on available indexed niches
  const matchingNiches = niches.filter((n) =>
    cleanQuery ? n.tag.toLowerCase().includes(cleanQuery) : true
  );

  const isExactNichePresent = niches.some(
    (n) => n.tag.toLowerCase() === cleanQuery
  );

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!cleanQuery || isScraping) return;

      const existing = niches.find((n) => n.tag.toLowerCase() === cleanQuery);
      if (existing && existing.videoCount > 0) {
        onAddChip(cleanQuery, "include");
        setQuery("");
        setIsDropdownOpen(false);
      } else {
        await handleScrapeAndAdd(cleanQuery);
      }
    }
  };

  const handleSelectSuggestion = (tag: string) => {
    onAddChip(tag, "include");
    setQuery("");
    setIsDropdownOpen(false);
  };

  const handleScrapeAndAdd = async (tag: string) => {
    if (!tag || isScraping) return;
    if (onTriggerScrape) {
      const success = await onTriggerScrape(tag);
      if (success) {
        setQuery("");
        setIsDropdownOpen(false);
      }
      // If scrape failed/empty: query remains in the input so user can edit or fix typos!
    } else {
      onAddChip(tag, "include");
      setQuery("");
      setIsDropdownOpen(false);
    }
  };

  const handleSavePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPackName.trim() && onSaveCustomPack) {
      onSaveCustomPack(customPackName.trim());
      setCustomPackName("");
      setIsSavePackModalOpen(false);
    }
  };

  return (
    <aside className="w-[310px] shrink-0 h-full bg-surface-container-lowest flex flex-col justify-between p-4 border-r border-surface-container-high/60 select-none relative z-20 overflow-y-auto">
      <div className="flex flex-col gap-3.5">
        {/* 1. Header: Stream Hub & Total Indexed Indicator */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-container text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-sm">tune</span>
            </span>
            <span className="font-headline-sm text-sm tracking-tight text-on-surface font-bold">
              Untpd Stream Hub
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high font-data-badge text-[11px] text-tertiary border border-surface-container-highest/60">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            {totalVideosCount.toLocaleString()} indexed
          </span>
        </div>

        {/* 2. Autocomplete Combobox with Hybrid Scrape Option */}
        <div ref={comboboxRef} className="relative flex flex-col gap-1">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant/70 text-sm pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder={
                isScraping
                  ? `Scraping #${scrapingNiche || cleanQuery || "..."}...`
                  : "Type #niche or keyword..."
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleInputKeyDown}
              disabled={isScraping}
              className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs pl-8 pr-8 py-2 rounded-xl outline-none focus:bg-surface-container border border-surface-container-high/60 focus:border-primary-container transition-all placeholder:text-on-surface-variant/50 disabled:opacity-70"
            />
            {isScraping ? (
              <div className="absolute right-2.5 flex items-center gap-1 text-primary">
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2 p-0.5 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            ) : (
              <span className="absolute right-2.5 font-data-badge text-[10px] text-on-surface-variant/40">
                ↵
              </span>
            )}
          </div>

          {/* Combobox Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-surface-container-high/95 backdrop-blur-md border border-surface-container-highest rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto flex flex-col gap-2">
              {!cleanQuery ? (
                /* Dual Section 1: Popular Viral Niches (when search is empty/focused) */
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-primary">
                    <span className="flex items-center gap-1 font-label-caps">
                      <span className="text-xs">🔥</span> Popular Viral Niches
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-data-badge">
                      1-click explore
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {POPULAR_VIRAL_NICHES.map((curated) => {
                      const dbNiche = niches.find(
                        (n) => n.tag.toLowerCase() === curated.tag.toLowerCase()
                      );
                      const count = dbNiche ? dbNiche.videoCount : 0;
                      const isAlreadyInChips = chips.some(
                        (c) => c.tag.toLowerCase() === curated.tag.toLowerCase()
                      );

                      return (
                        <button
                          key={curated.tag}
                          type="button"
                          disabled={isScraping}
                          onClick={() => {
                            if (count > 0) {
                              handleSelectSuggestion(curated.tag);
                            } else {
                              handleScrapeAndAdd(curated.tag);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-left border transition-all group ${
                            isAlreadyInChips
                              ? "bg-rose-500/10 border-rose-500/30"
                              : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="font-body-md text-xs font-medium text-on-surface truncate group-hover:text-primary">
                              #{curated.tag}
                            </span>
                            <span className="text-[9px] text-on-surface-variant/70 truncate">
                              {curated.category}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center">
                            {count > 0 ? (
                              <span className="font-data-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary">
                                {count}
                              </span>
                            ) : (
                              <span className="font-data-badge text-[9px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">bolt</span>
                                Scrape
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dual Section 2: Matching Indexed Niches & Novel Scrape */
                <div className="flex flex-col gap-1">
                  {matchingNiches.map((niche) => {
                    const isAlreadyInChips = chips.some(
                      (c) => c.tag.toLowerCase() === niche.tag.toLowerCase()
                    );
                    return (
                      <div
                        key={niche.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer transition-colors group"
                        onClick={() => {
                          if (niche.videoCount > 0) {
                            handleSelectSuggestion(niche.tag);
                          } else {
                            handleScrapeAndAdd(niche.tag);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-data-badge text-primary text-[11px]">#</span>
                          <span className="font-body-md text-xs font-medium text-on-surface truncate">
                            {niche.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {niche.videoCount > 0 ? (
                            <span className="font-data-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">
                              {niche.videoCount}
                            </span>
                          ) : (
                            <span className="font-data-badge text-[9px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">bolt</span>
                              Scrape
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (niche.videoCount > 0) {
                                handleSelectSuggestion(niche.tag);
                              } else {
                                handleScrapeAndAdd(niche.tag);
                              }
                            }}
                            className={`p-1 rounded transition-colors ${
                              isAlreadyInChips
                                ? "text-primary"
                                : "text-on-surface-variant hover:text-primary group-hover:bg-surface-container-high"
                            }`}
                            title={
                              niche.videoCount > 0
                                ? "Add to filter stack"
                                : "Scrape and add"
                            }
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isAlreadyInChips
                                ? "check"
                                : niche.videoCount > 0
                                ? "add"
                                : "bolt"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Novel / Live Scrape Option */}
                  {cleanQuery && !isExactNichePresent && (
                    <button
                      type="button"
                      disabled={isScraping}
                      onClick={() => handleScrapeAndAdd(cleanQuery)}
                      className="flex items-center justify-between px-2.5 py-2 mt-1 rounded-lg bg-primary-container/15 hover:bg-primary-container/25 text-primary border border-primary-container/30 text-xs font-medium transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-sm animate-pulse">bolt</span>
                        <span>Auto-Scrape TikTok for #{cleanQuery}</span>
                      </div>
                      <span className="font-data-badge text-[10px] text-tertiary uppercase">
                        Live Fetch
                      </span>
                    </button>
                  )}

                  {matchingNiches.length === 0 && !cleanQuery && (
                    <div className="p-2 text-center text-on-surface-variant/70 text-xs">
                      Type a hashtag or keyword above
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Boolean Match Switch: ANY (OR) vs. ALL (AND) */}
        <div className="flex items-center justify-between p-1 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider pl-2 font-semibold">
            Match Rule
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMatchModeChange("ANY")}
              className={`px-3 py-1 rounded-lg text-xs font-data-badge transition-all ${
                matchMode === "ANY"
                  ? "bg-surface-container-high text-primary font-bold shadow-sm border border-surface-container-highest"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              ANY (OR)
            </button>
            <button
              type="button"
              onClick={() => onMatchModeChange("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-data-badge transition-all ${
                matchMode === "ALL"
                  ? "bg-surface-container-high text-tertiary font-bold shadow-sm border border-surface-container-highest"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              ALL (AND)
            </button>
          </div>
        </div>

        {/* 4. Active Filter Chips Stack (Multi-State Include / Exclude) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Filter Stack ({chips.length})
            </span>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={onClearChips}
                className="text-[10px] font-data-badge text-on-surface-variant hover:text-primary transition-colors"
              >
                Clear Stack
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50">
            {chips.length === 0 ? (
              <span className="text-[11px] text-on-surface-variant/50 italic self-center px-1">
                No active chips. Showing full feed or pick a pack below.
              </span>
            ) : (
              chips.map((chip) => {
                const isInclude = chip.state === "include";
                return (
                  <div
                    key={chip.tag}
                    onClick={() => onCycleChip(chip.tag)}
                    title={`Click to switch: ${isInclude ? "Exclude (-)" : "Remove"}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all select-none border shadow-sm ${
                      isInclude
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                        : "bg-red-950/40 text-red-400 border-red-800/40 hover:bg-red-950/60 line-through"
                    }`}
                  >
                    <span className="font-data-badge text-[11px] font-bold">
                      {isInclude ? "+" : "−"}
                    </span>
                    <span>#{chip.tag}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveChip(chip.tag);
                      }}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-black/30 text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Remove filter chip"
                    >
                      <span className="material-symbols-outlined text-[11px]">close</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 5. Live Yield Counter */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-tertiary">
              filter_list
            </span>
            <span className="font-headline-sm text-xs font-semibold text-on-surface">
              Yield: <strong className="text-tertiary font-bold">{yieldCount}</strong> clips
            </span>
          </div>
          {excludedCount > 0 && (
            <span className="font-data-badge text-[10px] text-error bg-error-container/20 px-1.5 py-0.5 rounded border border-error/20">
              {excludedCount} dropped
            </span>
          )}
        </div>

        {/* 6. 1-Click Untpd Discovery Packs */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Discovery Packs
            </span>
            {chips.length > 0 && onSaveCustomPack && (
              <button
                type="button"
                onClick={() => setIsSavePackModalOpen(true)}
                className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-xs">bookmark_add</span>
                <span>Save Stack</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Built-in Packs */}
            {BUILT_IN_DISCOVERY_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => onSelectDiscoveryPack(pack)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60 hover:border-primary-container/40 transition-all text-left group"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    {pack.name}
                  </span>
                  <span className="font-body-sm text-[10px] text-on-surface-variant/70 truncate">
                    {pack.description}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="font-data-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {pack.chips.length} tags
                  </span>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              </button>
            ))}

            {/* Custom Saved Packs */}
            {customPacks.map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60 transition-all text-left group"
              >
                <button
                  type="button"
                  onClick={() => onSelectDiscoveryPack(pack)}
                  className="flex-1 text-left min-w-0"
                >
                  <span className="font-headline-sm text-xs font-bold text-on-surface group-hover:text-tertiary transition-colors">
                    ★ {pack.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70 truncate">
                    <span>{pack.chips.length} tags</span>
                  </div>
                </button>
                {onDeleteCustomPack && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomPack(pack.id)}
                    className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                    title="Delete custom pack"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Bottom Velocity Window & Geo Controls */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-surface-container-high/60 mt-3">
        {/* Rolling Velocity Window */}
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider px-0.5 font-semibold">
            Rolling Window
          </span>
          <div className="grid grid-cols-3 p-1 rounded-lg bg-surface-container-low text-center gap-0.5 border border-surface-container-high/50">
            {(["24h", "7d", "30d"] as const).map((w) => (
              <button
                key={w}
                type="button"
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
          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider px-0.5 font-semibold">
            Geo Region
          </span>
          <div className="grid grid-cols-4 gap-1 font-data-badge text-xs text-center">
            {(["US", "UK", "CA", "AU"] as const).map((r) => (
              <button
                key={r}
                type="button"
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
      </div>

      {/* Modal: Save Custom Discovery Pack */}
      {isSavePackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-high border border-surface-container-highest p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Save Filter Stack as Discovery Pack
              </h3>
              <button
                onClick={() => setIsSavePackModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePackSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Pack Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My AI Viral Stack"
                  value={customPackName}
                  onChange={(e) => setCustomPackName(e.target.value)}
                  required
                  className="bg-surface-container-low border border-surface-container-highest rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest/60 text-xs text-on-surface-variant">
                Contains {chips.length} active chips (
                {chips.map((c) => `${c.state === "include" ? "+" : "−"}${c.tag}`).join(", ")}
                )
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavePackModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customPackName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-headline-sm text-xs font-semibold hover:bg-primary-container/90 disabled:opacity-40"
                >
                  Save Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
