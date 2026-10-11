import fs from "fs";
import path from "path";

async function testDownloadPipeline() {
  console.log("=== Sikatsoon Media Pipeline Test ===");

  const { mediaService } = await import("../src/services/media-service");
  const { db, videos } = await import("../src/db");
  const { eq } = await import("drizzle-orm");

  const videoId = "7694694514350361869";
  const videoUrl = "https://www.tiktok.com/@sabrina_ramonov/video/7694694514350361869";

  console.log(`Testing yt-dlp download for video: ${videoId}...`);
  const startTime = Date.now();

  try {
    const localFilePath = await mediaService.downloadVideo(videoId, videoUrl);
    const downloadDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Download completed in ${downloadDuration}s: ${localFilePath}`);

    const stats = fs.statSync(path.resolve(process.cwd(), localFilePath));
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ Local MP4 verified: ${sizeMb} MB on disk.`);

    // Update SQLite database record
    await db
      .update(videos)
      .set({
        downloadStatus: "DOWNLOADED",
        localFilePath: localFilePath,
        isSaved: true,
      })
      .where(eq(videos.id, videoId));

    console.log(`✓ SQLite record updated: downloadStatus=DOWNLOADED, isSaved=true.`);
    console.log(`\n🎉 SUCCESS: Media pipeline is fully operational!`);
  } catch (err: any) {
    console.error("❌ Media download failed:", err.message || err);
    process.exit(1);
  }
}

testDownloadPipeline();
