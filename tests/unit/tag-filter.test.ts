import { describe, it, expect } from "vitest";
import {
  cycleChipState,
  videoMatchesTag,
  filterVideosByTags,
  BUILT_IN_DISCOVERY_PACKS,
  type FilterableVideo,
  type TagFilterChip,
} from "@/core/tag-filter";

describe("Sikatsoon: Untapped Hub (Untpd) Tag Filter Engine", () => {
  const sampleVideos: FilterableVideo[] = [
    {
      id: "vid-1",
      niche: "ai-tools",
      caption: "This new AI automation tool replaces 4 browser extensions! #aitools #tech #automation",
      viralScore: 95.5,
    },
    {
      id: "vid-2",
      niche: "dropshipping",
      caption: "Stop dropshipping from AliExpress in 2026. Use this viral product finder blueprint. #dropshipping #ecommerce",
      viralScore: 92.1,
    },
    {
      id: "vid-3",
      niche: "ai-tools",
      caption: "How to use ChatGPT to automate your dropshipping store ad copy in 10 minutes. #ai #dropship",
      viralScore: 89.0,
    },
    {
      id: "vid-4",
      niche: "fitness",
      caption: "Eat this 4-ingredient pre-workout bowl for insane pumps. #fitness #gym #nutrition",
      viralScore: 88.4,
    },
    {
      id: "vid-5",
      niche: "lifehacks",
      caption: "5 Amazon finds you must have for your desk setup! #amazonfinds #lifehacks",
      viralScore: 94.0,
    },
  ];

  describe("Chip State Cycle", () => {
    it("cycles from include (+) to exclude (-)", () => {
      expect(cycleChipState("include")).toBe("exclude");
    });

    it("cycles from exclude (-) to null (removed)", () => {
      expect(cycleChipState("exclude")).toBeNull();
    });
  });

  describe("Tag Matching Scope", () => {
    it("matches primary niche directly", () => {
      expect(videoMatchesTag(sampleVideos[0], "ai-tools")).toBe(true);
      expect(videoMatchesTag(sampleVideos[0], "fitness")).toBe(false);
    });

    it("matches hashtag in caption", () => {
      expect(videoMatchesTag(sampleVideos[0], "tech")).toBe(true);
      expect(videoMatchesTag(sampleVideos[0], "automation")).toBe(true);
    });

    it("matches keyword in caption prose", () => {
      expect(videoMatchesTag(sampleVideos[1], "AliExpress")).toBe(true);
      expect(videoMatchesTag(sampleVideos[2], "chatgpt")).toBe(true);
    });
  });

  describe("Hard Negation (-Exclude Rule)", () => {
    it("drops videos with excluded tags even when they match included tags", () => {
      const chips: TagFilterChip[] = [
        { tag: "ai-tools", state: "include" },
        { tag: "dropship", state: "exclude" },
      ];

      // Vid-1 is pure AI tools -> INCLUDED
      // Vid-3 is AI tools BUT mentions dropshipping -> EXCLUDED
      const result = filterVideosByTags(sampleVideos, chips, "ANY");

      expect(result.matchedVideos.length).toBe(1);
      expect(result.matchedVideos[0].id).toBe("vid-1");
      expect(result.excludedCount).toBeGreaterThanOrEqual(1);
    });

    it("drops all videos matching excluded tag when no include chips are defined", () => {
      const chips: TagFilterChip[] = [{ tag: "dropship", state: "exclude" }];

      const result = filterVideosByTags(sampleVideos, chips, "ANY");

      // Should exclude Vid-2 and Vid-3
      expect(result.matchedVideos.map((v) => v.id)).toEqual(["vid-1", "vid-5", "vid-4"]);
      expect(result.excludedCount).toBe(2);
    });
  });

  describe("Boolean Match Modes: ANY (OR) vs ALL (AND)", () => {
    it("ANY (OR) matches videos matching at least one included tag", () => {
      const chips: TagFilterChip[] = [
        { tag: "ai-tools", state: "include" },
        { tag: "fitness", state: "include" },
      ];

      const result = filterVideosByTags(sampleVideos, chips, "ANY");

      // Vid-1 (95.5), Vid-3 (89.0), Vid-4 (88.4)
      expect(result.matchedVideos.map((v) => v.id)).toEqual(["vid-1", "vid-3", "vid-4"]);
      expect(result.yieldCount).toBe(3);
    });

    it("ALL (AND) matches videos containing all included tags", () => {
      const chips: TagFilterChip[] = [
        { tag: "ai-tools", state: "include" },
        { tag: "dropship", state: "include" },
      ];

      const result = filterVideosByTags(sampleVideos, chips, "ALL");

      // Only Vid-3 has both AI tools and dropship
      expect(result.matchedVideos.length).toBe(1);
      expect(result.matchedVideos[0].id).toBe("vid-3");
    });
  });

  describe("Empty Stack Fallback", () => {
    it("yields all videos sorted by viralScore descending when no chips are present", () => {
      const result = filterVideosByTags(sampleVideos, []);

      expect(result.yieldCount).toBe(5);
      expect(result.matchedVideos[0].viralScore).toBe(95.5);
      expect(result.matchedVideos[4].viralScore).toBe(88.4);
    });
  });

  describe("Discovery Packs", () => {
    it("has valid built-in Discovery Packs", () => {
      expect(BUILT_IN_DISCOVERY_PACKS.length).toBe(3);
      const pureOrganic = BUILT_IN_DISCOVERY_PACKS.find((p) => p.id === "pure-organic");
      expect(pureOrganic).toBeDefined();
      expect(pureOrganic?.chips.some((c) => c.state === "exclude")).toBe(true);
    });
  });
});
