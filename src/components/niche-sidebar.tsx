"use client";

import React, { useState } from "react";
import type { NicheGroupWithMembers } from "@/app/actions/groups";

export interface NicheItem {
  id: string;
  tag: string;
  videoCount: number;
}

interface NicheSidebarProps {
  totalVideosCount: number;
  niches: NicheItem[];
  groups?: NicheGroupWithMembers[];
  selectedGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
  onCreateGroup?: (
    name: string,
    nicheTags: string[],
    scheduleEnabled?: boolean,
    scheduleType?: "daily" | "interval",
    scheduleTime?: string
  ) => Promise<void>;
  onUpdateGroupSchedule?: (
    groupId: string,
    scheduleEnabled: boolean,
    scheduleType: "daily" | "interval",
    scheduleTime: string
  ) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;

  selectedNiches: string[];
  onToggleNiche: (nicheTag: string) => void;
  onSelectAllNiches: () => void;
  onDeselectAllNiches: () => void;

  onAddNiche: (nicheTag: string) => void;
  onTriggerScrape?: (nicheTag: string) => Promise<void>;
  onTriggerBatchIngest?: (groupId?: string, nicheTags?: string[]) => Promise<void>;
  isScraping?: boolean;
  scrapingNiche?: string | null;
  isBatchIngesting?: boolean;

  timeframe: "24h" | "7d" | "30d";
  onTimeframeChange: (timeframe: "24h" | "7d" | "30d") => void;
  region: "US" | "UK" | "CA" | "AU";
  onRegionChange: (region: "US" | "UK" | "CA" | "AU") => void;
}

export function NicheSidebar({
  totalVideosCount,
  niches,
  groups = [],
  selectedGroupId = "",
  onSelectGroup,
  onCreateGroup,
  onUpdateGroupSchedule,
  onDeleteGroup,
  selectedNiches = [],
  onToggleNiche,
  onSelectAllNiches,
  onDeselectAllNiches,
  onAddNiche,
  onTriggerScrape,
  onTriggerBatchIngest,
  isScraping = false,
  scrapingNiche = null,
  isBatchIngesting = false,
  timeframe,
  onTimeframeChange,
  region,
  onRegionChange,
}: NicheSidebarProps) {
  const [newTag, setNewTag] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTags, setNewGroupTags] = useState("");
  const [newGroupScheduleEnabled, setNewGroupScheduleEnabled] = useState(false);
  const [newGroupScheduleType, setNewGroupScheduleType] = useState<"daily" | "interval">("daily");
  const [newGroupScheduleTime, setNewGroupScheduleTime] = useState("08:00");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Schedule Edit State
  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const [editScheduleEnabled, setEditScheduleEnabled] = useState(
    currentGroup?.scheduleEnabled || false
  );
  const [editScheduleType, setEditScheduleType] = useState<"daily" | "interval">(
    currentGroup?.scheduleType || "daily"
  );
  const [editScheduleTime, setEditScheduleTime] = useState(
    currentGroup?.scheduleTime || "08:00"
  );
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim().replace(/^#/, "");
    if (clean) {
      if (onTriggerScrape) {
        onTriggerScrape(clean);
      } else {
        onAddNiche(clean);
      }
      setNewTag("");
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !onCreateGroup) return;

    const tags = newGroupTags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (tags.length === 0) return;

    setIsSubmittingGroup(true);
    try {
      await onCreateGroup(
        newGroupName.trim(),
        tags,
        newGroupScheduleEnabled,
        newGroupScheduleType,
        newGroupScheduleTime
      );
      setNewGroupName("");
      setNewGroupTags("");
      setShowCreateModal(false);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!currentGroup || !onUpdateGroupSchedule) return;
    setIsUpdatingSchedule(true);
    try {
      await onUpdateGroupSchedule(
        currentGroup.id,
        editScheduleEnabled,
        editScheduleType,
        editScheduleTime
      );
      setShowScheduleModal(false);
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup || !onDeleteGroup) return;
    if (confirm(`Delete group "${currentGroup.name}"?`)) {
      await onDeleteGroup(currentGroup.id);
      setShowScheduleModal(false);
    }
  };

  const tagColors: Record<string, string> = {
    dropshipping: "text-secondary",
    "ai-tools": "text-tertiary",
    "fitness-gym": "text-outline",
    finance: "text-secondary-fixed",
    lifehacks: "text-primary",
  };

  // Determine which niches to display:
  // If a group is selected, show its member niches (plus any globally tracked niches)
  const groupNicheTags = currentGroup?.memberNiches || [];
  const displayedNiches = niches.filter((n) =>
    groupNicheTags.length > 0 ? groupNicheTags.includes(n.tag.toLowerCase()) : true
  );

  const isAllSelected =
    displayedNiches.length > 0 &&
    displayedNiches.every((n) => selectedNiches?.includes(n.tag.toLowerCase()));

  return (
    <aside className="w-[300px] shrink-0 h-full bg-surface-container-lowest flex flex-col justify-between p-4 border-r border-surface-container-high/60 select-none relative z-20">
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

        {/* 1. Group Selector & Schedule Status Header */}
        <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Niche Group
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              <span>New Group</span>
            </button>
          </div>

          {/* Group Dropdown Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedGroupId || currentGroup?.id || ""}
              onChange={(e) => onSelectGroup?.(e.target.value)}
              className="flex-1 bg-surface-container text-on-surface font-headline-sm text-xs py-1.5 px-2.5 rounded-lg border border-surface-container-high/70 outline-none focus:border-primary-container transition-all cursor-pointer truncate"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  📁 {g.name} ({g.memberNiches.length} niches)
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Status & Setting Pill */}
          {currentGroup && (
            <div className="flex items-center justify-between pt-1 border-t border-surface-container-highest/40">
              <button
                onClick={() => {
                  setEditScheduleEnabled(currentGroup.scheduleEnabled);
                  setEditScheduleType(currentGroup.scheduleType);
                  setEditScheduleTime(currentGroup.scheduleTime);
                  setShowScheduleModal(true);
                }}
                className={`text-[10px] font-data-badge flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  currentGroup.scheduleEnabled
                    ? "bg-secondary-container/20 border-secondary/40 text-secondary"
                    : "bg-surface-container border-surface-container-high text-on-surface-variant hover:text-on-surface"
                }`}
                title="Configure Group Schedule"
              >
                <span className="material-symbols-outlined text-[11px]">
                  {currentGroup.scheduleEnabled ? "schedule" : "schedule_send"}
                </span>
                <span>
                  {currentGroup.scheduleEnabled
                    ? currentGroup.scheduleType === "daily"
                      ? `Daily ${currentGroup.scheduleTime}`
                      : `Every ${currentGroup.scheduleTime}h`
                    : "Schedule: Off"}
                </span>
                <span className="material-symbols-outlined text-[10px]">edit</span>
              </button>

              {/* Batch Run Button */}
              {onTriggerBatchIngest && (
                <button
                  onClick={() => onTriggerBatchIngest(currentGroup.id, selectedNiches)}
                  disabled={isBatchIngesting || isScraping || selectedNiches.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary font-headline-sm text-[11px] font-semibold flex items-center gap-1 shadow-md transition-all active:scale-95 disabled:opacity-40"
                  title="Ingest and auto-download breakout MP4s for all checked niches"
                >
                  {isBatchIngesting ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">
                        progress_activity
                      </span>
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">play_arrow</span>
                      <span>Run Batch ({selectedNiches.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Track new hashtag form */}
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Track / scrape #niche..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              disabled={isScraping || isBatchIngesting}
              className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs pl-3 pr-8 py-2 rounded-lg outline-none focus:bg-surface-container border border-surface-container-high/60 focus:border-primary-container transition-all placeholder:text-on-surface-variant/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isScraping || isBatchIngesting || !newTag.trim()}
              className="absolute right-1.5 p-1 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-variant transition-colors disabled:opacity-40 disabled:hover:bg-surface-container-high disabled:hover:text-on-surface-variant"
              title="Discover viral TikToks"
            >
              {isScraping && (!scrapingNiche || scrapingNiche === newTag.toLowerCase().trim().replace(/^#/, "")) ? (
                <span className="material-symbols-outlined text-xs animate-spin text-primary">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-xs">travel_explore</span>
              )}
            </button>
          </div>
        </form>

        {/* 3. Multi-Select Niches List */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Active Niches ({selectedNiches.length}/{displayedNiches.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={isAllSelected ? onDeselectAllNiches : onSelectAllNiches}
                className="text-[10px] font-data-badge text-tertiary hover:underline"
              >
                {isAllSelected ? "Clear All" : "Select All"}
              </button>
            </div>
          </div>

          {/* Niches List with Checkboxes */}
          <div className="flex flex-col gap-1 max-h-[calc(100vh-450px)] overflow-y-auto pr-0.5">
            {displayedNiches.length === 0 ? (
              <div className="p-3 text-center text-on-surface-variant text-xs">
                No niches in this group. Type #niche above to add one.
              </div>
            ) : (
              displayedNiches.map((niche) => {
                const isChecked = selectedNiches?.includes(niche.tag.toLowerCase());
                const hashColor = tagColors[niche.tag.toLowerCase()] || "text-secondary";

                return (
                  <div
                    key={niche.id}
                    onClick={() => onToggleNiche(niche.tag)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg transition-all cursor-pointer group ${
                      isChecked
                        ? "bg-primary-container/20 text-on-surface border border-primary-container/30 shadow-sm"
                        : "hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {/* Checkbox indicator */}
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors border ${
                          isChecked
                            ? "bg-primary-container border-primary-container text-on-primary"
                            : "border-surface-container-highest bg-surface-container-low"
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-[10px] font-bold">
                            check
                          </span>
                        )}
                      </div>

                      <span className={`font-data-badge text-xs ${hashColor}`}>#</span>
                      <span className="font-body-md text-xs truncate font-medium">
                        {niche.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-data-badge text-[11px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant group-hover:bg-surface-container">
                        {niche.videoCount}
                      </span>
                      {onTriggerScrape && (
                        <button
                          type="button"
                          title={`Discover viral videos for #${niche.tag} (${region})`}
                          disabled={isScraping || isBatchIngesting}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerScrape(niche.tag);
                          }}
                          className="p-1 rounded text-on-surface-variant/70 hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-40"
                        >
                          {isScraping && scrapingNiche === niche.tag.toLowerCase() ? (
                            <span className="material-symbols-outlined text-xs animate-spin text-primary">
                              progress_activity
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-xs">sync</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Filters & Controls */}
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
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-low/60 border border-surface-container-high/40 font-label-caps text-[10px] text-on-surface-variant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-data-badge text-[10px]">
                J
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-data-badge text-[10px]">
                K
              </kbd>
              <span className="ml-1 text-[11px]">or Scroll</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-data-badge text-[10px]">
                L
              </kbd>
              <span className="text-[11px]">Save</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: Create New Group                                            */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-high border border-surface-container-highest p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">create_new_folder</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface">New Niche Group</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Health & Longevity, E-Commerce"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="bg-surface-container-low border border-surface-container-highest rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Member Niches (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="fitness, gym, biohacking, nutrition"
                  value={newGroupTags}
                  onChange={(e) => setNewGroupTags(e.target.value)}
                  required
                  className="bg-surface-container-low border border-surface-container-highest rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              {/* Schedule options */}
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest/60 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-on-surface font-semibold">
                    Automated Ingestion Schedule
                  </span>
                  <input
                    type="checkbox"
                    checked={newGroupScheduleEnabled}
                    onChange={(e) => setNewGroupScheduleEnabled(e.target.checked)}
                    className="accent-primary-container cursor-pointer"
                  />
                </div>

                {newGroupScheduleEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container-highest/40">
                    <div>
                      <label className="text-[10px] text-on-surface-variant">Type</label>
                      <select
                        value={newGroupScheduleType}
                        onChange={(e) => setNewGroupScheduleType(e.target.value as any)}
                        className="w-full mt-0.5 bg-surface-container border border-surface-container-highest rounded px-2 py-1 text-xs text-on-surface"
                      >
                        <option value="daily">Daily</option>
                        <option value="interval">Interval (Hours)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-on-surface-variant">
                        {newGroupScheduleType === "daily" ? "Time (HH:MM)" : "Every (Hours)"}
                      </label>
                      <input
                        type="text"
                        value={newGroupScheduleTime}
                        onChange={(e) => setNewGroupScheduleTime(e.target.value)}
                        placeholder={newGroupScheduleType === "daily" ? "08:00" : "12"}
                        className="w-full mt-0.5 bg-surface-container border border-surface-container-highest rounded px-2 py-1 text-xs text-on-surface"
                      >
                      </input>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup || !newGroupName.trim() || !newGroupTags.trim()}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-headline-sm text-xs font-semibold hover:bg-primary-container/90 disabled:opacity-40"
                >
                  {isSubmittingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: Edit Group Schedule & Settings                              */}
      {/* ==================================================================== */}
      {showScheduleModal && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-high border border-surface-container-highest p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                  Schedule: {currentGroup.name}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest">
                <div>
                  <p className="font-headline-sm text-xs text-on-surface font-semibold">Enable Schedule</p>
                  <p className="font-body-sm text-[10px] text-on-surface-variant">
                    Auto-scrape &amp; download breakouts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editScheduleEnabled}
                  onChange={(e) => setEditScheduleEnabled(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
              </div>

              {editScheduleEnabled && (
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest">
                  <div>
                    <label className="text-[10px] text-on-surface-variant">Frequency</label>
                    <select
                      value={editScheduleType}
                      onChange={(e) => setEditScheduleType(e.target.value as any)}
                      className="w-full mt-1 bg-surface-container border border-surface-container-highest rounded px-2 py-1.5 text-xs text-on-surface"
                    >
                      <option value="daily">Daily</option>
                      <option value="interval">Interval</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant">
                      {editScheduleType === "daily" ? "Time (24h format)" : "Hours"}
                    </label>
                    <input
                      type="text"
                      value={editScheduleTime}
                      onChange={(e) => setEditScheduleTime(e.target.value)}
                      placeholder={editScheduleType === "daily" ? "08:00" : "12"}
                      className="w-full mt-1 bg-surface-container border border-surface-container-highest rounded px-2 py-1.5 text-xs text-on-surface"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  className="text-xs text-error hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                  <span>Delete Group</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={isUpdatingSchedule}
                    className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-headline-sm text-xs font-semibold hover:bg-primary-container/90 disabled:opacity-40"
                  >
                    {isUpdatingSchedule ? "Saving..." : "Save Schedule"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
