"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

export interface RepurposeItem {
  id: string;
  authorUsername: string;
  caption: string;
  viralScore: number;
  videoUrl: string;
  downloadStatus: "IDLE" | "DOWNLOADING" | "DOWNLOADED" | "FAILED";
  localFilePath?: string | null;
  transcriptionStatus: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED";
  transcriptText?: string | null;
}

interface RepurposeStudioProps {
  items: RepurposeItem[];
  onDownload: (id: string) => Promise<void>;
  onTranscribe: (id: string) => Promise<void>;
}

export function RepurposeStudio({
  items,
  onDownload,
  onTranscribe,
}: RepurposeStudioProps) {
  const [filter, setFilter] = useState<"ALL" | "DOWNLOADED" | "TRANSCRIBED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id || "");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<"1.0x" | "1.25x" | "1.5x">("1.25x");

  // AI Script Remixer state
  const [activePreset, setActivePreset] = useState<"SHORT" | "THREAD" | "HOOKS">("SHORT");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === "DOWNLOADED" && item.downloadStatus !== "DOWNLOADED") return false;
      if (filter === "TRANSCRIBED" && item.transcriptionStatus !== "COMPLETED") return false;
      if (filter === "PENDING" && (item.downloadStatus === "DOWNLOADED" && item.transcriptionStatus === "COMPLETED")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.authorUsername.toLowerCase().includes(q) ||
          item.caption.toLowerCase().includes(q) ||
          (item.transcriptText && item.transcriptText.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, filter, searchQuery]);

  const activeItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || items[0] || null;
  }, [items, selectedId]);

  const handleCopyText = (sectionKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleBatchExport = () => {
    const textBlob = items
      .map(
        (i) =>
          `# Video @${i.authorUsername} (Score: ${i.viralScore})\nURL: ${i.videoUrl}\n\n## Caption Hook\n${i.caption}\n\n## Transcript\n${i.transcriptText || "[Not transcribed]"}\n\n---\n`
      )
      .join("\n");

    const element = document.createElement("a");
    const file = new Blob([textBlob], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `sikatsoon-curation-batch-${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Generate smart template script remix based on preset
  const handleGenerateRemix = () => {
    if (!activeItem) return;
    setIsGenerating(true);

    setTimeout(() => {
      const hook = activeItem.caption || "Watch this viral breakdown...";
      const body = activeItem.transcriptText || "Here is the exact mechanism and framework...";

      let result = "";
      if (activePreset === "SHORT") {
        result = `🎬 [YOUTUBE SHORTS SCRIPT (45s Format)]
HOOK (0-3s):
"Stop scrolling if you're trying to win with ${activeItem.authorUsername}'s strategy. Here is the 1 flaw nobody is talking about."

BODY (4-35s):
"${body.replace(/\. /g, '.\n')}"

CALL TO ACTION (36-45s):
"Save this Short and subscribe for daily breakdowns before products hit saturation."`;
      } else if (activePreset === "THREAD") {
        result = `🧵 [X / TWITTER VIRAL THREAD]
1/ How @${activeItem.authorUsername} drove breakout virality in 48 hours:

${hook}

Here is the exact 3-step breakdown 🧵👇

2/ The Pattern Interrupt:
Notice how the first 3 seconds target search intent instead of generic entertainment.

3/ The Fulfillment Loop:
"${body.slice(0, 160)}..."

4/ Follow @SikatsoonLab for daily reverse-engineered viral reels.`;
      } else {
        result = `⚡ [5 ALTERNATE VIRAL HOOKS]
1. "The reason 99% of people fail at this in 2026 isn't what you think..."
2. "If I had to start from $0 with 0 followers, this is the exact test I'd run today."
3. "Do NOT buy this until you watch this 20-second warning."
4. "The supplier secret that generated over $140k in 14 days without paid ads."
5. "Steal this 3-step framework before your competitors see it."`;
      }

      setGeneratedScript(result);
      setIsGenerating(false);
    }, 400);
  };

  // Derive timestamped sections from transcript text
  const structuredSections = useMemo(() => {
    if (!activeItem?.transcriptText) {
      return [
        {
          key: "hook",
          time: "00:00 - 00:03",
          title: "HOOK · PATTERN INTERRUPT",
          badge: "89% Retain",
          badgeColor: "text-tertiary bg-tertiary-container/10",
          text: activeItem?.caption || "Stop scrolling if you want to see this winning product.",
          isPrimary: true,
        },
        {
          key: "body",
          time: "00:03 - 00:28",
          title: "BODY · THE MECHANISM & PROOF",
          badge: null,
          badgeColor: "",
          text: "Transcribe this clip via Whisper-1 to extract the full spoken breakdown.",
          isPrimary: false,
        },
        {
          key: "cta",
          time: "00:28 - 00:45",
          title: "CALL TO ACTION · OFFER & LOOP",
          badge: null,
          badgeColor: "",
          text: "Comment for blueprint and save this before it gets saturated.",
          isPrimary: false,
        },
      ];
    }

    const sentences = activeItem.transcriptText.split(". ");
    const hookSentence = sentences[0] || activeItem.caption;
    const bodySentences = sentences.slice(1, -1).join(". ") || "Here is the step-by-step breakdown...";
    const ctaSentence = sentences[sentences.length - 1] || "Don't forget to bookmark and share.";

    return [
      {
        key: "hook",
        time: "00:00 - 00:03",
        title: "HOOK · PATTERN INTERRUPT",
        badge: "89% Retain",
        badgeColor: "text-tertiary bg-tertiary-container/10",
        text: `“${hookSentence}.”`,
        isPrimary: true,
      },
      {
        key: "body",
        time: "00:03 - 00:28",
        title: "BODY · THE MECHANISM & PROOF",
        badge: null,
        badgeColor: "",
        text: `“${bodySentences}.”`,
        isPrimary: false,
      },
      {
        key: "cta",
        time: "00:28 - 00:45",
        title: "CALL TO ACTION · OFFER & LOOP",
        badge: null,
        badgeColor: "",
        text: `“${ctaSentence}”`,
        isPrimary: false,
      },
    ];
  }, [activeItem]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-surface-container-lowest select-none">
      {/* 1. Command Header & Breadcrumb Toolbar */}
      <div className="px-4 py-2 bg-surface-container-lowest border-b border-surface-container-high/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Breadcrumb Hierarchy */}
          <div className="flex items-center gap-1.5 font-body-sm text-xs text-on-surface-variant">
            <Link href="/feed" className="hover:text-on-surface cursor-pointer transition-colors">
              Sikatsoon
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-headline-sm text-sm font-bold flex items-center gap-1.5">
              <span>Repurposing Lab</span>
              <span className="font-data-badge text-xs text-on-surface-variant font-normal">
                ({items.length} Videos Queued)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-data-badge text-[10px] ml-1 border border-tertiary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
              <span>WHISPER-V3 PIPELINE ACTIVE</span>
            </span>
          </div>

          {/* Segment Filter Controls */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                filter === "ALL"
                  ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>All Queued</span>
              <span className="font-data-badge text-[10px] px-1 rounded bg-on-primary-container/40 text-primary-fixed">
                {items.length}
              </span>
            </button>
            <button
              onClick={() => setFilter("DOWNLOADED")}
              className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                filter === "DOWNLOADED"
                  ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Downloaded</span>
              <span className="font-data-badge text-[10px] px-1 rounded bg-surface-container-highest text-tertiary">
                {items.filter((i) => i.downloadStatus === "DOWNLOADED").length}
              </span>
            </button>
            <button
              onClick={() => setFilter("TRANSCRIBED")}
              className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                filter === "TRANSCRIBED"
                  ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Transcribed</span>
              <span className="font-data-badge text-[10px] px-1 rounded bg-surface-container-highest text-tertiary-fixed">
                {items.filter((i) => i.transcriptionStatus === "COMPLETED").length}
              </span>
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                filter === "PENDING"
                  ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Pending</span>
              <span className="font-data-badge text-[10px] px-1 rounded bg-surface-container-highest text-secondary">
                {items.filter((i) => i.downloadStatus !== "DOWNLOADED" || i.transcriptionStatus !== "COMPLETED").length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Batch Export CTA */}
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search saved hooks & transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface pl-8 pr-10 py-1.5 rounded-lg text-xs font-body-sm placeholder:text-outline border border-surface-container-high/60 focus:outline-none focus:border-primary-container transition-all"
            />
            <div className="absolute right-2 top-1.5 px-1 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-badge text-[10px]">
              ⌘F
            </div>
          </div>

          <button
            onClick={handleBatchExport}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-inverse-primary active:scale-[0.98] transition-all flex items-center gap-1.5 font-body-md text-xs font-semibold shadow-md whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">archive</span>
            <span>Batch Export Scripts</span>
            <span className="font-data-badge text-[10px] px-1 rounded bg-on-primary-container/40 text-primary-fixed">
              MD
            </span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry Sub-strip / Pipeline Status */}
      <div className="px-4 py-1 bg-surface-container border-b border-surface-container-high/50 flex items-center justify-between text-on-surface-variant font-data-badge text-[11px] overflow-x-auto gap-4 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-xs text-tertiary">memory</span>
            Node 04-US-EAST (yt-dlp v2026.08.19)
          </span>
          <span>•</span>
          <span className="text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">speed</span>
            Avg Transcribe Latency: 2.3s / video
          </span>
          <span>•</span>
          <span>VRAM Allocation: 7.2 GB / 24 GB</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-on-surface-variant">
            Export Destination: <span className="text-secondary font-mono">storage/downloads/</span>
          </span>
        </div>
      </div>

      {/* 3. Split View Matrix Area */}
      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        {/* LEFT COLUMN: Card Matrix Grid */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 h-full overflow-hidden">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg border border-surface-container-high/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="font-headline-sm text-xs font-bold text-on-surface">
                  Curation Intake Stack
                </span>
              </div>
              <span className="font-data-badge text-[11px] text-on-surface-variant">
                Showing {filteredItems.length} of {items.length} Active Records
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <Link
                href="/feed"
                className="flex items-center gap-1 text-on-surface hover:text-primary transition-colors px-2 py-1 rounded bg-surface-container border border-surface-container-high"
              >
                <span className="material-symbols-outlined text-xs">sync</span>
                <span>Discover More Videos</span>
              </Link>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">
                  bookmark_remove
                </span>
                <p className="font-headline-sm text-sm">No videos match this filter</p>
                <p className="font-body-sm text-xs mt-1">
                  Adjust your filter or bookmark more trending clips in the Live Matrix.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                {filteredItems.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  const isDownloaded = item.downloadStatus === "DOWNLOADED";
                  const isTranscribed = item.transcriptionStatus === "COMPLETED";

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`flex flex-col rounded-xl p-2.5 shadow-md transition-all relative overflow-hidden cursor-pointer border ${
                        isSelected
                          ? "bg-surface-container border-primary-container ring-1 ring-primary-container shadow-xl"
                          : "bg-surface-container-low border-surface-container-high/60 hover:border-surface-container-highest"
                      }`}
                    >
                      {/* Top Row Creator + Score */}
                      <div className="flex items-center justify-between mb-1.5 z-10">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-secondary text-xs">
                            verified
                          </span>
                          <span className="font-headline-sm text-xs font-bold text-on-surface tracking-tight truncate">
                            @{item.authorUsername}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-data-badge text-[10px] font-bold">
                          <span>🔥</span>
                          <span>{item.viralScore.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Video Thumbnail 9:14 Aspect with Overlays */}
                      <div className="relative w-full aspect-[9/13] rounded-lg overflow-hidden bg-surface-container-highest group mb-2 border border-surface-container-high/40">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                          style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80')`,
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent" />

                        {/* Top Status Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isDownloaded ? (
                            <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary font-data-badge text-[10px] font-bold">
                              DOWNLOADED (MP4)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-data-badge text-[10px] font-bold">
                              PENDING DOWNLOAD
                            </span>
                          )}

                          {isTranscribed && (
                            <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary font-data-badge text-[10px] font-bold">
                              TRANSCRIBED
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur text-on-surface font-data-badge text-[10px]">
                            00:45s
                          </span>
                        </div>

                        {/* Floating Hook Pill at bottom */}
                        <div className="absolute bottom-2 inset-x-2 p-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur border border-surface-container-high/40">
                          <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-[9px] uppercase mb-0.5">
                            <span>Hook Pattern</span>
                            <span className="text-tertiary font-data-badge">Retention 89%</span>
                          </div>
                          <p className="font-body-sm text-[11px] text-on-surface font-semibold line-clamp-2 leading-tight">
                            “{item.caption || "Discover winning product framework..."}”
                          </p>
                        </div>
                      </div>

                      {/* Engagement Telemetry */}
                      <div className="grid grid-cols-3 gap-1 bg-surface-container p-1.5 rounded-lg text-center mb-2 border border-surface-container-high/40">
                        <div className="flex flex-col">
                          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                            Score
                          </span>
                          <span className="font-data-metric text-xs text-on-surface font-bold">
                            {item.viralScore.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                            Status
                          </span>
                          <span className="font-data-metric text-xs text-tertiary font-bold">
                            {isDownloaded ? "Cached" : "Online"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                            Audio
                          </span>
                          <span className="font-data-metric text-xs text-secondary font-bold">
                            {isTranscribed ? "Ready" : "Queue"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Stack */}
                      <div className="flex flex-col gap-1.5 mt-auto">
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(item.id);
                            }}
                            disabled={isDownloaded || item.downloadStatus === "DOWNLOADING"}
                            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                              isDownloaded
                                ? "bg-surface-container-high text-tertiary cursor-default"
                                : item.downloadStatus === "DOWNLOADING"
                                ? "bg-surface-container-high text-on-surface-variant cursor-wait"
                                : "bg-primary-container text-on-primary hover:bg-inverse-primary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isDownloaded ? "check_circle" : "download"}
                            </span>
                            <span>
                              {isDownloaded
                                ? "MP4 Saved"
                                : item.downloadStatus === "DOWNLOADING"
                                ? "Downloading..."
                                : "Download MP4"}
                            </span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(`card-${item.id}`, item.caption);
                            }}
                            className="px-2 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs flex items-center transition-all border border-surface-container-high"
                            title="Copy Hook Text"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {copiedSection === `card-${item.id}` ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(item.id);
                          }}
                          className={`w-full py-1.5 px-2.5 rounded text-xs flex items-center justify-center gap-1.5 font-medium transition-all ${
                            isSelected
                              ? "bg-primary-container text-on-primary font-bold shadow-sm"
                              : "bg-surface-container-high hover:bg-surface-bright text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">terminal</span>
                          <span>
                            {isSelected ? "Loaded in Script Lab →" : "Load into Script Lab →"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DRAWER: Expanded Script Lab & Repurposing Engine (~420px) */}
        {activeItem && (
          <div className="w-[420px] shrink-0 h-full flex flex-col rounded-xl bg-surface-container-low border border-surface-container-high/60 shadow-2xl p-3.5 gap-3 overflow-y-auto">
            {/* Drawer Header Bar */}
            <div className="flex items-start justify-between pb-1 border-b border-surface-container-high/50">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <span className="font-headline-sm text-sm font-bold text-on-surface">
                    Script &amp; Repurpose Lab
                  </span>
                </div>
                <span className="font-data-badge text-[11px] text-on-surface-variant mt-0.5">
                  Active: <span className="text-primary font-medium">@{activeItem.authorUsername}</span> · Viral Score: {activeItem.viralScore.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={activeItem.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Open original TikTok URL"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>

            {/* Audio Player & Waveform Visualization */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-surface-container border border-surface-container-high/50">
              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:bg-inverse-primary transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isPlayingAudio ? "pause" : "play_arrow"}
                    </span>
                  </button>
                  <span className="font-data-metric text-xs text-on-surface">
                    00:18 <span className="text-on-surface-variant font-normal">/ 00:45</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setAudioSpeed(
                        audioSpeed === "1.0x" ? "1.25x" : audioSpeed === "1.25x" ? "1.5x" : "1.0x"
                      )
                    }
                    className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-data-badge text-[10px]"
                  >
                    {audioSpeed} SPEED
                  </button>
                  <button className="p-1 text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                  </button>
                </div>
              </div>

              {/* Waveform Bars with Scrubber */}
              <div className="relative w-full h-10 flex items-center justify-between gap-[2px] pt-1 select-none">
                <div className="absolute left-[40%] top-0 bottom-0 w-[2px] bg-primary z-20 shadow-[0_0_8px_#ff5168]">
                  <div className="w-2 h-2 rounded-full bg-primary-container -ml-[3px] -top-1 absolute" />
                </div>
                {/* Simulated discrete speech waveform bars */}
                {[16, 24, 36, 44, 28, 32, 40, 20, 32, 44, 40, 24, 28, 40].map((h, i) => (
                  <div
                    key={`played-${i}`}
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full ${
                      h > 36 ? "bg-primary-container animate-pulse" : "bg-tertiary"
                    }`}
                  />
                ))}
                {[36, 44, 24, 16, 32, 40, 28, 20, 36, 40, 28, 16, 24, 12].map((h, i) => (
                  <div
                    key={`unplayed-${i}`}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-surface-container-highest rounded-full"
                  />
                ))}
              </div>

              <div className="flex justify-between items-center text-on-surface-variant font-data-badge text-[10px] px-1">
                <span className="text-tertiary">Whisper 99.4% Confidence</span>
                <span>Audio: 16kHz Mono MP3</span>
              </div>
            </div>

            {/* Timestamped Transcript Breakdown Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                  Whisper Structured Breakdown
                </span>
                <button
                  onClick={() =>
                    handleCopyText("srt", activeItem.transcriptText || activeItem.caption)
                  }
                  className="font-data-badge text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  <span>Export SRT</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {structuredSections.map((sec) => (
                  <div
                    key={sec.key}
                    className={`p-2.5 rounded-lg bg-surface-container relative overflow-hidden border ${
                      sec.isPrimary ? "border-primary-container/40" : "border-surface-container-high/40"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        sec.isPrimary ? "bg-primary-container" : "bg-surface-variant"
                      }`}
                    />
                    <div className="flex items-center justify-between mb-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="font-data-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface">
                          {sec.time}
                        </span>
                        <span className="font-label-caps text-[10px] uppercase text-primary font-bold">
                          {sec.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {sec.badge && (
                          <span
                            className={`font-data-badge text-[10px] px-1 rounded ${sec.badgeColor}`}
                          >
                            {sec.badge}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyText(sec.key, sec.text)}
                          className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Copy section"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copiedSection === sec.key ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface pl-1 leading-snug">
                      {sec.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Script Remixer & LLM Prompt Engine */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-surface-container border border-surface-container-high/60 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary-container text-base">
                    smart_toy
                  </span>
                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                    AI Repurpose Engine
                  </span>
                </div>
                <span className="font-data-badge text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  Template Adaptor
                </span>
              </div>

              {/* Quick Prompt Preset Pills */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActivePreset("SHORT")}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    activePreset === "SHORT"
                      ? "bg-primary-container text-on-primary font-semibold"
                      : "bg-surface-container-high hover:bg-surface-bright text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                  <span>YouTube Short</span>
                </button>
                <button
                  onClick={() => setActivePreset("THREAD")}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    activePreset === "THREAD"
                      ? "bg-primary-container text-on-primary font-semibold"
                      : "bg-surface-container-high hover:bg-surface-bright text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">share</span>
                  <span>X Thread</span>
                </button>
                <button
                  onClick={() => setActivePreset("HOOKS")}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    activePreset === "HOOKS"
                      ? "bg-primary-container text-on-primary font-semibold"
                      : "bg-surface-container-high hover:bg-surface-bright text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">bolt</span>
                  <span>5 Alternate Hooks</span>
                </button>
              </div>

              {/* Custom Prompt Box */}
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Instruction: e.g. Adapt hook for B2B SaaS niche, emphasize the margin breakdown..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface p-2 rounded-lg text-xs font-body-sm placeholder:text-outline border border-surface-container-high/60 focus:outline-none focus:border-primary-container resize-none"
                />
              </div>

              {/* Generation Execution CTA */}
              <button
                onClick={handleGenerateRemix}
                disabled={isGenerating}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-body-md text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-sm">neurology</span>
                <span>{isGenerating ? "Remixing Script..." : "Generate Remixed Script →"}</span>
              </button>

              {/* Generated Script Preview */}
              {generatedScript && (
                <div className="mt-1 p-2 rounded-lg bg-surface-container-lowest border border-primary-container/40 flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[10px] text-primary uppercase font-bold">
                      Remixed Output
                    </span>
                    <button
                      onClick={() => handleCopyText("remix", generatedScript)}
                      className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedSection === "remix" ? "check" : "content_copy"}
                      </span>
                      <span>{copiedSection === "remix" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {generatedScript}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
