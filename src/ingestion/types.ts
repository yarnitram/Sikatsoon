// ============================================================================
// Sikatsoon Ingestion Contracts & Domain Types
// ============================================================================

export type RegionCode = "US" | "UK" | "CA" | "AU";
export type TimeframeOption = "24h" | "7d" | "30d";

export interface RawScrapedVideo {
  id: string; // TikTok Video ID
  authorUsername: string;
  region: RegionCode;
  niche: string;
  caption: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  publishedAt: number; // Unix timestamp in seconds
  videoUrl: string;
}

export interface NormalizedScrapedVideo extends RawScrapedVideo {
  viralScore: number;
}

export interface IngestionParams {
  niche: string;
  region: RegionCode;
  timeframe?: TimeframeOption;
  limit?: number;
}

export interface IngestionAdapter {
  fetchTrending(params: IngestionParams): Promise<RawScrapedVideo[]>;
}

// ============================================================================
// Domain Error Hierarchy
// ============================================================================

export class IngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionError";
  }
}

export class IngestionQuotaExceededError extends IngestionError {
  constructor(message: string = "Apify token limit or rate limits reached. Please check API quota.") {
    super(message);
    this.name = "IngestionQuotaExceededError";
  }
}

export class IngestionNetworkError extends IngestionError {
  constructor(message: string = "Network error while connecting to Apify actor.") {
    super(message);
    this.name = "IngestionNetworkError";
  }
}
