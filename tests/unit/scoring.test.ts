import { describe, it, expect } from "vitest";
import {
  calculateViralScore,
  calculateVelocity,
  calculateInteractionRatio,
} from "@/core/scoring";

describe("Sikatsoon: Viral Velocity Scoring Engine", () => {
  const fixedNow = 1700000000; // Fixed epoch time for deterministic assertions

  describe("Invariant 1: Zero Views & Division Guards", () => {
    it("returns 0 score when views count is 0", () => {
      const score = calculateViralScore({
        views: 0,
        likes: 100,
        comments: 50,
        shares: 20,
        publishedAt: fixedNow - 3600,
        currentTime: fixedNow,
      });
      expect(score).toBe(0);
    });

    it("returns 0 velocity when views count is 0 or negative", () => {
      expect(calculateVelocity(0, fixedNow - 3600, fixedNow)).toBe(0);
      expect(calculateVelocity(-500, fixedNow - 3600, fixedNow)).toBe(0);
    });

    it("returns 0 interaction ratio when views count is 0", () => {
      expect(calculateInteractionRatio(100, 50, 20, 0)).toBe(0);
    });

    it("clamps elapsed hours to minimum 1 hour if video was published less than 1 hour ago", () => {
      // Published 10 minutes ago (600 seconds)
      const publishedAt = fixedNow - 600;
      const views = 60000;
      const velocity = calculateVelocity(views, publishedAt, fixedNow);

      // Should divide by 1 hour (not 0.1666 hours), yielding exactly 60,000 views/hr
      expect(velocity).toBe(60000);
    });

    it("guards against future published timestamps", () => {
      // Future timestamp
      const publishedAt = fixedNow + 3600;
      const views = 10000;
      const velocity = calculateVelocity(views, publishedAt, fixedNow);
      expect(velocity).toBe(10000); // clamped to 1 hour
    });
  });

  describe("Invariant 2: Interaction Depth & Algorithmic Weights", () => {
    it("applies 3x weight to shares and 2x weight to comments relative to likes", () => {
      const views = 10000;

      // 100 likes = 100
      const ratioLikes = calculateInteractionRatio(100, 0, 0, views);

      // 100 comments = 200
      const ratioComments = calculateInteractionRatio(0, 100, 0, views);

      // 100 shares = 300
      const ratioShares = calculateInteractionRatio(0, 0, 100, views);

      expect(ratioLikes).toBe(100 / views);
      expect(ratioComments).toBe(200 / views);
      expect(ratioShares).toBe(300 / views);
      expect(ratioShares).toBe(ratioLikes * 3);
      expect(ratioComments).toBe(ratioLikes * 2);
    });

    it("returns 0 score when interactions are zero even with high views", () => {
      const score = calculateViralScore({
        views: 1000000,
        likes: 0,
        comments: 0,
        shares: 0,
        publishedAt: fixedNow - 3600,
        currentTime: fixedNow,
      });
      expect(score).toBe(0);
    });
  });

  describe("Invariant 3: Recency Velocity Decay", () => {
    it("scores recent videos significantly higher than older videos with identical stats", () => {
      const baseStats = {
        views: 100000,
        likes: 10000,
        comments: 1000,
        shares: 2000,
      };

      // Video A: Published 2 hours ago
      const scoreRecent = calculateViralScore({
        ...baseStats,
        publishedAt: fixedNow - 7200, // 2 hours
        currentTime: fixedNow,
      });

      // Video B: Published 20 hours ago
      const scoreOld = calculateViralScore({
        ...baseStats,
        publishedAt: fixedNow - 72000, // 20 hours
        currentTime: fixedNow,
      });

      // Video A velocity is 100k / 2 = 50k
      // Video B velocity is 100k / 20 = 5k
      // Therefore Video A score should be 10x Video B score
      expect(scoreRecent).toBeGreaterThan(scoreOld);
      expect(scoreRecent).toBeCloseTo(scoreOld * 10, 1);
    });
  });

  describe("Deterministic Mathematical Assertions", () => {
    it("computes exact score according to mathematical specification", () => {
      // Views: 50,000
      // Published: 5 hours ago (18,000s) -> Velocity = 50,000 / 5 = 10,000
      // Likes: 4,000 (4,000)
      // Comments: 500 (1,000)
      // Shares: 1,000 (3,000)
      // Total Interactions = 8,000
      // InteractionRatio = 8,000 / 50,000 = 0.16
      // Expected ViralScore = 10,000 * 0.16 = 1,600.00
      const score = calculateViralScore({
        views: 50000,
        likes: 4000,
        comments: 500,
        shares: 1000,
        publishedAt: fixedNow - 18000,
        currentTime: fixedNow,
      });

      expect(score).toBe(1600.0);
    });
  });
});
