import { describe, it, expect } from "vitest";
import {
  formatNicheTag,
  extractHashtagsFromCaption,
  POPULAR_VIRAL_NICHES,
} from "@/core/niche-catalog";

describe("Sikatsoon: Niche Catalog & Caption Hashtag Extractor", () => {
  describe("formatNicheTag", () => {
    it("strips leading '#' and converts to lowercase", () => {
      expect(formatNicheTag("#Ai-Tools")).toBe("ai-tools");
      expect(formatNicheTag("##Dropshipping")).toBe("dropshipping");
      expect(formatNicheTag("   #ChatGPT   ")).toBe("chatgpt");
    });

    it("removes invalid symbols and trims trailing dashes", () => {
      expect(formatNicheTag("#tech_reviews!")).toBe("tech_reviews");
      expect(formatNicheTag("--coding--")).toBe("coding");
    });
  });

  describe("extractHashtagsFromCaption", () => {
    it("extracts multiple unique hashtags from caption text", () => {
      const caption = "Best AI tools for creators in 2026! #ai #automation #aitools #tech #productivity";
      const tags = extractHashtagsFromCaption(caption);

      expect(tags).toContain("ai");
      expect(tags).toContain("automation");
      expect(tags).toContain("aitools");
      expect(tags).toContain("tech");
      expect(tags).toContain("productivity");
    });

    it("filters out generic spam hashtags like #fyp, #viral, #foryou", () => {
      const caption = "Amazing life hack! #lifehacks #fyp #viral #foryou #amazonfinds";
      const tags = extractHashtagsFromCaption(caption);

      expect(tags).toContain("lifehacks");
      expect(tags).toContain("amazonfinds");
      expect(tags).not.toContain("fyp");
      expect(tags).not.toContain("viral");
      expect(tags).not.toContain("foryou");
    });

    it("handles captions without hashtags cleanly", () => {
      const caption = "Just a regular video caption without any tags.";
      expect(extractHashtagsFromCaption(caption)).toEqual([]);
    });
  });

  describe("POPULAR_VIRAL_NICHES", () => {
    it("contains curated popular niches across key creator verticals", () => {
      expect(POPULAR_VIRAL_NICHES.length).toBeGreaterThanOrEqual(15);
      const tags = POPULAR_VIRAL_NICHES.map((n) => n.tag);
      expect(tags).toContain("ai-tools");
      expect(tags).toContain("dropshipping");
      expect(tags).toContain("sidehustle");
      expect(tags).toContain("fitness");
      expect(tags).toContain("lifehacks");
    });
  });
});
