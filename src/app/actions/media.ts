"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db, videos } from "@/db";
import { eq } from "drizzle-orm";
import { mediaService } from "@/services/media-service";

// ============================================================================
// 1. Zod Validation Schemas
// ============================================================================

export const MediaActionInputSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

// ============================================================================
// 2. Action Result Interfaces
// ============================================================================

export interface DownloadActionResult {
  success: boolean;
  videoId: string;
  downloadStatus: "IDLE" | "DOWNLOADING" | "DOWNLOADED" | "FAILED";
  localFilePath?: string;
  message?: string;
}

export interface TranscribeActionResult {
  success: boolean;
  videoId: string;
  transcriptionStatus: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED";
  transcriptText?: string;
  message?: string;
}

// ============================================================================
// 3. Media Processing Server Actions
// ============================================================================

/**
 * Triggers background subprocess execution of yt-dlp to download watermark-free
 * TikTok video directly to local disk (storage/downloads/{videoId}.mp4).
 */
export async function downloadMediaAction(
  videoId: string
): Promise<DownloadActionResult> {
  const parse = MediaActionInputSchema.safeParse({ videoId });
  if (!parse.success) {
    return {
      success: false,
      videoId,
      downloadStatus: "FAILED",
      message: "Invalid video ID provided",
    };
  }

  try {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      return {
        success: false,
        videoId,
        downloadStatus: "FAILED",
        message: `Video ${videoId} not found in database`,
      };
    }

    // Set DOWNLOADING status
    await db
      .update(videos)
      .set({ downloadStatus: "DOWNLOADING" })
      .where(eq(videos.id, videoId));

    // Invoke yt-dlp through mediaService
    const localFilePath = await mediaService.downloadVideo(videoId, video.videoUrl);

    // Set DOWNLOADED status and persist local path
    await db
      .update(videos)
      .set({ downloadStatus: "DOWNLOADED", localFilePath })
      .where(eq(videos.id, videoId));

    revalidatePath("/repurpose");
    revalidatePath("/feed");

    return {
      success: true,
      videoId,
      downloadStatus: "DOWNLOADED",
      localFilePath,
      message: "Video downloaded successfully",
    };
  } catch (error: any) {
    // Set FAILED status on error
    await db
      .update(videos)
      .set({ downloadStatus: "FAILED" })
      .where(eq(videos.id, videoId))
      .catch(() => {});

    return {
      success: false,
      videoId,
      downloadStatus: "FAILED",
      message: error?.message || "yt-dlp subprocess failed",
    };
  }
}

/**
 * Extracts mono 16kHz audio from local MP4 via ffmpeg subprocess,
 * streams audio to OpenAI Whisper API (whisper-1), and persists transcript text to SQLite.
 */
export async function transcribeMediaAction(
  videoId: string
): Promise<TranscribeActionResult> {
  const parse = MediaActionInputSchema.safeParse({ videoId });
  if (!parse.success) {
    return {
      success: false,
      videoId,
      transcriptionStatus: "FAILED",
      message: "Invalid video ID provided",
    };
  }

  try {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      return {
        success: false,
        videoId,
        transcriptionStatus: "FAILED",
        message: `Video ${videoId} not found in database`,
      };
    }

    if (!video.localFilePath) {
      return {
        success: false,
        videoId,
        transcriptionStatus: "FAILED",
        message: "Video file must be downloaded before transcription",
      };
    }

    // Set PROCESSING status
    await db
      .update(videos)
      .set({ transcriptionStatus: "PROCESSING" })
      .where(eq(videos.id, videoId));

    // Run ffmpeg audio extraction + Whisper-1 transcription
    const transcriptText = await mediaService.transcribeVideo(
      videoId,
      video.localFilePath
    );

    // Set COMPLETED status and persist transcript
    await db
      .update(videos)
      .set({ transcriptionStatus: "COMPLETED", transcriptText })
      .where(eq(videos.id, videoId));

    revalidatePath("/repurpose");
    revalidatePath("/feed");

    return {
      success: true,
      videoId,
      transcriptionStatus: "COMPLETED",
      transcriptText,
      message: "Transcription completed via Whisper-1",
    };
  } catch (error: any) {
    // Set FAILED status on error
    await db
      .update(videos)
      .set({ transcriptionStatus: "FAILED" })
      .where(eq(videos.id, videoId))
      .catch(() => {});

    return {
      success: false,
      videoId,
      transcriptionStatus: "FAILED",
      message: error?.message || "ffmpeg / Whisper transcription failed",
    };
  }
}
