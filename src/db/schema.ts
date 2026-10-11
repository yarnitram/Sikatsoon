import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================================
// 1. Niches Table
// ============================================================================
export const niches = sqliteTable("niches", {
  id: text("id").primaryKey(), // unique slug or uuid
  tag: text("tag").notNull().unique(), // lowercase hashtag without '#'
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type NicheRecord = typeof niches.$inferSelect;
export type NewNicheRecord = typeof niches.$inferInsert;

// ============================================================================
// 2. Videos Table
// ============================================================================
export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(), // TikTok Video ID
    authorUsername: text("author_username").notNull(),
    region: text("region", { enum: ["US", "UK", "CA", "AU"] }).notNull(),
    niche: text("niche").notNull(), // foreign key reference to niche tag
    caption: text("caption").default(""),
    viewsCount: integer("views_count").notNull(),
    likesCount: integer("likes_count").notNull(),
    sharesCount: integer("shares_count").notNull(),
    commentsCount: integer("comments_count").notNull(),
    viralScore: real("viral_score").notNull(),
    publishedAt: integer("published_at").notNull(), // Unix timestamp (seconds)
    videoUrl: text("video_url").notNull(),
    isSaved: integer("is_saved", { mode: "boolean" }).notNull().default(false),
    downloadStatus: text("download_status", {
      enum: ["IDLE", "DOWNLOADING", "DOWNLOADED", "FAILED"],
    })
      .notNull()
      .default("IDLE"),
    localFilePath: text("local_file_path"),
    transcriptionStatus: text("transcription_status", {
      enum: ["IDLE", "PROCESSING", "COMPLETED", "FAILED"],
    })
      .notNull()
      .default("IDLE"),
    transcriptText: text("transcript_text"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    nicheScoreIdx: index("idx_videos_niche_score").on(table.niche, table.viralScore),
    regionTimeIdx: index("idx_videos_region_time").on(table.region, table.publishedAt),
    savedIdx: index("idx_videos_is_saved").on(table.isSaved),
  })
);

export type VideoRecord = typeof videos.$inferSelect;
export type NewVideoRecord = typeof videos.$inferInsert;
