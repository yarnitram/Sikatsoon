"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Sparkles,
  ExternalLink,
  Flame,
} from "lucide-react";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeItem = items.find((i) => i.id === activeTranscriptId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      {/* Top Bar Navigation */}
      <div className="max-w-7xl mx-auto flex items-center justify-between pb-8 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <Link
            href="/feed"
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all border border-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Repurpose Studio
            </h1>
            <p className="text-xs text-neutral-400">
              Download watermark-free MP4s, generate Whisper transcripts, and rewrite scripts for YouTube Shorts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
            {items.length} Bookmarked Clips
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto pt-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-neutral-900/50 rounded-3xl border border-neutral-800 text-center">
            <Sparkles className="w-12 h-12 text-neutral-600 mb-4 animate-pulse" />
            <h2 className="text-lg font-bold text-white mb-1">
              Your Repurposing Lab is Empty
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6">
              Head back to the Curation Feed and tap the heart icon on viral videos to collect them here.
            </p>
            <Link
              href="/feed"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold text-xs shadow-md hover:opacity-90 transition-all"
            >
              Open Curation Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900/80 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg"
              >
                {/* Header & Meta */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-200">
                      @{item.authorUsername}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      {item.viralScore.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                    {item.caption || "No caption provided."}
                  </p>

                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300"
                  >
                    <span>View original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Processing Actions */}
                <div className="p-4 bg-neutral-950/60 border-t border-neutral-800/80 space-y-2">
                  {/* Download MP4 Button */}
                  <button
                    onClick={() => onDownload(item.id)}
                    disabled={
                      item.downloadStatus === "DOWNLOADING" ||
                      item.downloadStatus === "DOWNLOADED"
                    }
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      item.downloadStatus === "DOWNLOADED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : item.downloadStatus === "DOWNLOADING"
                        ? "bg-neutral-800 text-neutral-400 cursor-wait"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    {item.downloadStatus === "DOWNLOADING" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {item.downloadStatus === "DOWNLOADED" && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {item.downloadStatus === "IDLE" && (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {item.downloadStatus === "IDLE" && "Download MP4 (yt-dlp)"}
                      {item.downloadStatus === "DOWNLOADING" && "Downloading..."}
                      {item.downloadStatus === "DOWNLOADED" && "Downloaded (Local MP4)"}
                      {item.downloadStatus === "FAILED" && "Retry Download"}
                    </span>
                  </button>

                  {/* Transcribe Button */}
                  <button
                    onClick={() => onTranscribe(item.id)}
                    disabled={
                      item.downloadStatus !== "DOWNLOADED" ||
                      item.transcriptionStatus === "PROCESSING"
                    }
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      item.transcriptionStatus === "COMPLETED"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30"
                        : item.transcriptionStatus === "PROCESSING"
                        ? "bg-neutral-800 text-neutral-400 cursor-wait"
                        : item.downloadStatus !== "DOWNLOADED"
                        ? "bg-neutral-900/50 text-neutral-600 cursor-not-allowed"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    {item.transcriptionStatus === "PROCESSING" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {item.transcriptionStatus === "COMPLETED" && (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    {item.transcriptionStatus === "IDLE" && (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {item.transcriptionStatus === "IDLE" && "Transcribe (Whisper-1)"}
                      {item.transcriptionStatus === "PROCESSING" && "Transcribing Audio..."}
                      {item.transcriptionStatus === "COMPLETED" && "View Transcript"}
                      {item.transcriptionStatus === "FAILED" && "Retry Transcription"}
                    </span>
                  </button>

                  {/* Copy Script CTA (If transcribed) */}
                  {item.transcriptionStatus === "COMPLETED" && item.transcriptText && (
                    <button
                      onClick={() => handleCopy(item.id, item.transcriptText!)}
                      className="w-full py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">
                            Copied to Clipboard!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Transcript Script</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript Modal (Optional inspect) */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-white text-base">
                  Transcript: @{activeItem.authorUsername}
                </h3>
                <p className="text-xs text-neutral-400">Extracted via OpenAI Whisper-1</p>
              </div>
              <button
                onClick={() => setActiveTranscriptId(null)}
                className="text-neutral-500 hover:text-white text-xs font-mono px-2 py-1 bg-neutral-800 rounded-lg"
              >
                Close (ESC)
              </button>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl max-h-80 overflow-y-auto text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
              {activeItem.transcriptText || "No transcript content."}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleCopy(activeItem.id, activeItem.transcriptText || "")}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Full Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
