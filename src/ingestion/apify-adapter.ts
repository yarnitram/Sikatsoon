import {
  IngestionAdapter,
  IngestionParams,
  RawScrapedVideo,
  NormalizedScrapedVideo,
  IngestionQuotaExceededError,
  IngestionNetworkError,
} from "./types";

/**
 * Pure Viral Velocity Scoring Algorithm:
 * Velocity = views / max((CurrentTime - PublishedAt) / 3600, 1)
 * InteractionRatio = (likes + (2 * comments) + (3 * shares)) / max(views, 1)
 * ViralScore = Velocity * InteractionRatio
 */
export function calculateViralScore(video: {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  publishedAt: number;
}): number {
  if (video.views <= 0) {
    return 0;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const elapsedHours = Math.max((nowSeconds - video.publishedAt) / 3600, 1);
  const velocity = video.views / elapsedHours;

  const interactionDepth =
    video.likes + 2 * video.comments + 3 * video.shares;
  const interactionRatio = interactionDepth / Math.max(video.views, 1);

  return Number((velocity * interactionRatio).toFixed(2));
}

/**
 * Apify TikTok Actor Adapter (clockworks/free-tiktok-scraper)
 * Normalizes API payloads to Sikatsoon schema invariants.
 */
export class ApifyTikTokAdapter implements IngestionAdapter {
  private apiToken: string;
  private actorId: string = "clockworks~free-tiktok-scraper";

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.APIFY_API_TOKEN || "";
  }

  async fetchTrending(params: IngestionParams): Promise<RawScrapedVideo[]> {
    const { niche, region, limit = 20 } = params;

    if (!this.apiToken) {
      throw new IngestionNetworkError(
        "APIFY_API_TOKEN is not configured. Please add your Apify token to .env.local."
      );
    }

    const endpoint = `https://api.apify.com/v2/acts/${this.actorId}/run-sync-get-dataset-items?token=${this.apiToken}&timeout=120`;

    const actorInput = {
      searchQueries: [`#${niche}`],
      resultsPerPage: limit,
      countryCode: region.toLowerCase(),
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actorInput),
      });

      if (response.status === 429 || response.status === 402) {
        throw new IngestionQuotaExceededError(
          `Apify quota exceeded (HTTP ${response.status}). Check actor usage limits.`
        );
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new IngestionNetworkError(
          `Apify API request failed with status HTTP ${response.status}: ${errorText}`
        );
      }

      const items = await response.json();
      const rawItems = Array.isArray(items) ? items : (items?.items || []);

      return rawItems.map((item: any) => this.normalizeItem(item, niche, region));
    } catch (err: any) {
      if (err instanceof IngestionQuotaExceededError) {
        throw err;
      }
      throw new IngestionNetworkError(
        err?.message || "Failed to communicate with Apify actor"
      );
    }
  }

  /**
   * Normalizes raw Apify JSON item into Sikatsoon's RawScrapedVideo schema.
   */
  normalizeItem(raw: any, niche: string, region: IngestionParams["region"]): RawScrapedVideo {
    const views = Number(raw.playCount || raw.views || 0);
    const likes = Number(raw.diggCount || raw.likes || 0);
    const shares = Number(raw.shareCount || raw.shares || 0);
    const comments = Number(raw.commentCount || raw.comments || 0);
    const publishedAt = Math.floor(
      new Date(raw.createTimeISO || raw.createTime * 1000 || Date.now()).getTime() / 1000
    );

    const videoId = String(raw.id || raw.videoId || "");

    return {
      id: videoId,
      authorUsername: String(raw.authorMeta?.name || raw.author?.uniqueId || "creator"),
      region,
      niche: niche.toLowerCase().replace(/^#/, ""),
      caption: String(raw.text || raw.desc || ""),
      views,
      likes,
      shares,
      comments,
      publishedAt,
      videoUrl: raw.webVideoUrl || `https://www.tiktok.com/@${raw.authorMeta?.name}/video/${videoId}`,
    };
  }

  /**
   * Applies virality scoring and enforces the 10,000 views minimum ingestion invariant.
   */
  processAndScore(videos: RawScrapedVideo[]): NormalizedScrapedVideo[] {
    return videos
      .filter((v) => v.views >= 10000) // Minimum ingestion threshold invariant
      .map((v) => ({
        ...v,
        viralScore: calculateViralScore(v),
      }))
      .sort((a, b) => b.viralScore - a.viralScore);
  }
}
