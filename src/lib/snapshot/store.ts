import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Snapshot } from "./schema";
import { snapshotSchema } from "./schema";

const DEFAULT_DB = path.join(process.cwd(), "data", "cockpit.db");

/**
 * SQLite snapshot store — the data-plane boundary. The collector POSTs to
 * /api/ingest → writeSnapshot; the web reads readLatestSnapshot and never
 * touches a source directly.
 *
 * Uses Node's built-in node:sqlite (Node ≥22.5, experimental) — zero deps,
 * fine for a single-writer/single-reader file DB. Swap for better-sqlite3
 * if the experimental flag ever matters.
 */
export class SnapshotStore {
  readonly db: DatabaseSync;

  constructor(dbPath = process.env.COCKPIT_DB ?? DEFAULT_DB) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        generated_at TEXT NOT NULL,
        received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        payload TEXT NOT NULL
      )
    `);
  }

  write(snapshot: Snapshot): void {
    this.db
      .prepare("INSERT INTO snapshots (generated_at, payload) VALUES (?, ?)")
      .run(snapshot.generatedAt, JSON.stringify(snapshot));
  }

  /**
   * Most recent valid snapshot, or undefined when the store is empty or the
   * latest rows are unparseable. Newest-first so a bad row never wedges the
   * board — it falls through to the previous good snapshot.
   */
  readLatest(limit = 5): Snapshot | undefined {
    const rows = this.db
      .prepare("SELECT payload FROM snapshots ORDER BY id DESC LIMIT ?")
      .all(limit) as { payload: string }[];
    for (const { payload } of rows) {
      const parsed = snapshotSchema.safeParse(JSON.parse(payload));
      if (parsed.success) return parsed.data;
    }
    return undefined;
  }

  close(): void {
    this.db.close();
  }
}

let store: SnapshotStore | undefined;

export function getSnapshotStore(): SnapshotStore {
  store ??= new SnapshotStore();
  return store;
}

/** Test hook — reset the shared instance (e.g. after setting COCKPIT_DB). */
export function resetSnapshotStore(): void {
  store?.close();
  store = undefined;
}
