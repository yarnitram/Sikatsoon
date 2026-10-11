import fs from "fs";
import path from "path";

// 1. Safe load of .env.local without exposing tokens
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  try {
    if (typeof (process as any).loadEnvFile === "function") {
      (process as any).loadEnvFile(envLocalPath);
    } else {
      const content = fs.readFileSync(envLocalPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...vals] = trimmed.split("=");
          process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
        }
      });
    }
  } catch (err) {
    console.warn("Notice: could not auto-load .env.local with process.loadEnvFile, parsed manually.");
  }
}

async function runTestIngestion() {
  console.log("=== Sikatsoon Live Ingestion Test ===");
  console.log("Checking APIFY_API_TOKEN...");

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error("❌ ERROR: APIFY_API_TOKEN is empty in .env.local.");
    console.error("Please add: APIFY_API_TOKEN=your_token in .env.local");
    process.exit(1);
  }

  console.log("✓ APIFY_API_TOKEN detected (length:", token.length, "characters).");
  console.log("Targeting niche: #ai-tools (Region: US, Limit: 10)...");

  // Dynamically import adapter and db
  const { ApifyTikTokAdapter } = await import("../src/ingestion/apify-adapter");
  const { db, videos, niches } = await import("../src/db");

  const adapter = new ApifyTikTokAdapter(token);

  console.log("Calling Apify actor (clockworks~free-tiktok-scraper)...");
  const startTime = Date.now();

  try {
    const rawVideos = await adapter.fetchTrending({
      niche: "ai-tools",
      region: "US",
      limit: 10,
    });

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Fetched ${rawVideos.length} raw clips from Apify in ${durationSec}s.`);

    const scored = adapter.processAndScore(rawVideos);
    console.log(`✓ Scored videos passing >=10k views threshold: ${scored.length} clips.`);

    let insertedCount = 0;
    for (const v of scored) {
      await db
        .insert(videos)
        .values({
          id: v.id,
          authorUsername: v.authorUsername,
          region: v.region,
          niche: v.niche,
          caption: v.caption,
          viewsCount: v.views,
          likesCount: v.likes,
          sharesCount: v.shares,
          commentsCount: v.comments,
          viralScore: v.viralScore,
          publishedAt: v.publishedAt,
          videoUrl: v.videoUrl,
          isSaved: false,
          downloadStatus: "IDLE",
          transcriptionStatus: "IDLE",
        })
        .onConflictDoUpdate({
          target: videos.id,
          set: {
            viewsCount: v.views,
            likesCount: v.likes,
            sharesCount: v.shares,
            commentsCount: v.comments,
            viralScore: v.viralScore,
          },
        });
      insertedCount++;
    }

    await db
      .insert(niches)
      .values({
        id: "ai-tools",
        tag: "ai-tools",
        displayName: "AI TOOLS",
      })
      .onConflictDoNothing();

    console.log(`\n🎉 SUCCESS! Ingested and persisted ${insertedCount} viral videos into SQLite.`);
    if (scored.length > 0) {
      const top = scored[0];
      console.log("\n--- Top Scored Viral Clip ---");
      console.log(`Creator:      @${top.authorUsername}`);
      console.log(`Views:        ${top.views.toLocaleString()}`);
      console.log(`Viral Score:  ${top.viralScore}`);
      console.log(`Caption:      ${top.caption.slice(0, 100)}...`);
      console.log(`URL:          ${top.videoUrl}`);
    }
  } catch (error: any) {
    console.error("❌ Ingestion error:", error.message || error);
    process.exit(1);
  }
}

runTestIngestion();
