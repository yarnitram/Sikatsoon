import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Resolve local storage directory for SQLite database
const DB_DIR = path.resolve(process.cwd(), "storage");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "sikatsoon.db");

// LibSQL embedded client: 100% SQLite compatible, cross-platform, zero C++ compilation
const client = createClient({
  url: `file:${DB_PATH}`,
});

export const db = drizzle(client, { schema });

export * from "./schema";
