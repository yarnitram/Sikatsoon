import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

export interface IMediaService {
  /**
   * Executes local `yt-dlp` subprocess.
   * Downloads watermark-free video to `storage/downloads/{videoId}.mp4`.
   */
  downloadVideo(videoId: string, videoUrl: string): Promise<string>;

  /**
   * Uses `ffmpeg` to extract a mono 16kHz MP3 track from the local MP4,
   * then streams it to OpenAI Whisper API.
   */
  transcribeVideo(videoId: string, localFilePath: string): Promise<string>;
}

function resolveExecutable(name: "yt-dlp" | "ffmpeg"): string {
  const envVar = name === "yt-dlp" ? process.env.YTDLP_PATH : process.env.FFMPEG_PATH;
  if (envVar && fs.existsSync(envVar)) {
    return envVar;
  }

  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE || "";
    if (name === "yt-dlp") {
      const wingetPath = path.join(
        userProfile,
        "AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe"
      );
      if (fs.existsSync(wingetPath)) return wingetPath;
    } else {
      const wingetPath = path.join(
        userProfile,
        "AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe"
      );
      if (fs.existsSync(wingetPath)) return wingetPath;

      const altWinget = path.join(
        userProfile,
        "AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-126374-g089a48eb36-win64-gpl/bin/ffmpeg.exe"
      );
      if (fs.existsSync(altWinget)) return altWinget;
    }
  }

  return name;
}

export class MediaService implements IMediaService {
  private downloadsDir: string;
  private tempDir: string;
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.downloadsDir = path.resolve(process.cwd(), "storage", "downloads");
    this.tempDir = path.resolve(process.cwd(), "storage", "temp");

    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || "",
    });
  }

  /**
   * Executes local yt-dlp to download high-resolution watermark-free MP4.
   */
  async downloadVideo(videoId: string, videoUrl: string): Promise<string> {
    const targetFile = path.join(this.downloadsDir, `${videoId}.mp4`);

    // If already downloaded, return immediately
    if (fs.existsSync(targetFile)) {
      return `storage/downloads/${videoId}.mp4`;
    }

    const ytdlpBin = resolveExecutable("yt-dlp");

    return new Promise((resolve, reject) => {
      const args = [
        videoUrl,
        "-o",
        targetFile,
        "--no-playlist",
        "--no-warnings",
        "-f",
        "b[ext=mp4]/best[ext=mp4]/best",
        "--merge-output-format",
        "mp4",
      ];

      const proc = spawn(ytdlpBin, args, { stdio: ["ignore", "pipe", "pipe"] });

      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code === 0 && fs.existsSync(targetFile)) {
          resolve(targetFile);
        } else {
          reject(
            new Error(
              `yt-dlp download failed with exit code ${code}: ${stderr.trim() || "Unknown error"}`
            )
          );
        }
      });

      proc.on("error", (err) => {
        reject(
          new Error(
            `Failed to spawn yt-dlp. Ensure yt-dlp is installed and available in PATH. Error: ${err.message}`
          )
        );
      });
    });
  }

  /**
   * Extracts audio via ffmpeg enforcing:
   * -ac 1 (mono channel)
   * -ar 16000 (16kHz sampling)
   * -b:a 64k (64kbps bitrate)
   * Ensures 60s clips are < 1MB, well within OpenAI Whisper 25MB limits.
   */
  private async extractAudio(videoId: string, localFilePath: string): Promise<string> {
    const audioPath = path.join(this.tempDir, `${videoId}-audio.mp3`);

    return new Promise((resolve, reject) => {
      const args = [
        "-y",
        "-i",
        localFilePath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-b:a",
        "64k",
        audioPath,
      ];

      const ffmpegBin = resolveExecutable("ffmpeg");
      const proc = spawn(ffmpegBin, args, { stdio: ["ignore", "pipe", "pipe"] });

      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code === 0 && fs.existsSync(audioPath)) {
          resolve(audioPath);
        } else {
          reject(
            new Error(
              `ffmpeg audio extraction failed with exit code ${code}: ${stderr.trim()}`
            )
          );
        }
      });

      proc.on("error", (err) => {
        reject(
          new Error(
            `Failed to spawn ffmpeg. Ensure ffmpeg is installed and available in PATH. Error: ${err.message}`
          )
        );
      });
    });
  }

  /**
   * Extracts audio track and calls OpenAI Whisper API (whisper-1).
   */
  async transcribeVideo(videoId: string, localFilePath: string): Promise<string> {
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Video file not found at path: ${localFilePath}`);
    }

    const audioPath = await this.extractAudio(videoId, localFilePath);

    try {
      const audioStream = fs.createReadStream(audioPath);
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        language: "en",
        temperature: 0.2,
      });

      return transcription.text.trim();
    } finally {
      // Clean up temporary audio MP3 file
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch (_) {
          // ignore cleanup errors
        }
      }
    }
  }
}

export const mediaService = new MediaService();
