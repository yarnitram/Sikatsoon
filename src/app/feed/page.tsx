import { FeedPage } from "@/components/feed-page";
import type { VideoItem } from "@/components/feed-canvas";
import type { NicheItem } from "@/components/niche-sidebar";

const INITIAL_NICHES: NicheItem[] = [
  { id: "1", tag: "dropshipping", videoCount: 142 },
  { id: "2", tag: "ai-tools", videoCount: 94 },
  { id: "3", tag: "fitness-gym", videoCount: 380 },
  { id: "4", tag: "finance", videoCount: 215 },
  { id: "5", tag: "lifehacks", videoCount: 120 },
];

const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: "73829104859",
    authorUsername: "ecommerce_ninja",
    region: "US",
    niche: "dropshipping",
    caption:
      "POV: You found the #1 winning product that generated $42k in 3 days with zero ad spend...",
    viewsCount: 1240000,
    likesCount: 142000,
    commentsCount: 3800,
    sharesCount: 18400,
    viralScore: 94.2,
    publishedAt: Math.floor(Date.now() / 1000) - 3600 * 3,
    videoUrl: "https://www.tiktok.com/@ecommerce_ninja/video/73829104859",
    isSaved: true,
  },
  {
    id: "73829104991",
    authorUsername: "ai_architect",
    region: "US",
    niche: "ai-tools",
    caption:
      "Stop paying for voice actors. This free model replicates any human voice with a 3-second sample...",
    viewsCount: 2400000,
    likesCount: 210000,
    commentsCount: 8200,
    sharesCount: 41000,
    viralScore: 98.4,
    publishedAt: Math.floor(Date.now() / 1000) - 3600 * 5,
    videoUrl: "https://www.tiktok.com/@ai_architect/video/73829104991",
    isSaved: false,
  },
  {
    id: "73829105123",
    authorUsername: "iron_coach",
    region: "UK",
    niche: "fitness-gym",
    caption:
      "The only 2 back exercises you need if you have less than 45 minutes to train...",
    viewsCount: 940000,
    likesCount: 89000,
    commentsCount: 1900,
    sharesCount: 11200,
    viralScore: 88.1,
    publishedAt: Math.floor(Date.now() / 1000) - 3600 * 8,
    videoUrl: "https://www.tiktok.com/@iron_coach/video/73829105123",
    isSaved: false,
  },
  {
    id: "73829105456",
    authorUsername: "wealth_habits",
    region: "AU",
    niche: "finance",
    caption:
      "If you have $5,000 in your bank account right now, do NOT invest it in the S&P 500...",
    viewsCount: 1500000,
    likesCount: 118000,
    commentsCount: 4100,
    sharesCount: 22000,
    viralScore: 91.5,
    publishedAt: Math.floor(Date.now() / 1000) - 3600 * 12,
    videoUrl: "https://www.tiktok.com/@wealth_habits/video/73829105456",
    isSaved: false,
  },
  {
    id: "73829105789",
    authorUsername: "efficiency_lab",
    region: "CA",
    niche: "lifehacks",
    caption:
      "Most people do not know this iPhone trick that transcribes handwritten notes in 1 second...",
    viewsCount: 810000,
    likesCount: 74000,
    commentsCount: 2100,
    sharesCount: 9800,
    viralScore: 86.0,
    publishedAt: Math.floor(Date.now() / 1000) - 3600 * 16,
    videoUrl: "https://www.tiktok.com/@efficiency_lab/video/73829105789",
    isSaved: false,
  },
];

export default function FeedRoute() {
  return <FeedPage initialVideos={INITIAL_VIDEOS} initialNiches={INITIAL_NICHES} />;
}
