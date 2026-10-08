import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Snapshot } from "./schema";
import { SnapshotStore } from "./store";

let dir: string;

function open() {
  dir = mkdtempSync(path.join(tmpdir(), "cockpit-snap-"));
  return new SnapshotStore(path.join(dir, "cockpit.db"));
}

function snap(at: string): Snapshot {
  return {
    generatedAt: at,
    sources: [
      {
        source: "gmail",
        ok: true,
        fetchedAt: at,
        readouts: [
          {
            id: `r-${at}`,
            source: "gmail",
            segment: "",
            title: "Test",
            timestamp: at,
            url: "https://example.com",
            status: "advisory",
          },
        ],
      },
    ],
  };
}

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("SnapshotStore", () => {
  it("returns undefined when empty", () => {
    expect(open().readLatest()).toBeUndefined();
  });

  it("round-trips and returns the newest snapshot", () => {
    const store = open();
    store.write(snap("2026-10-08T00:00:00Z"));
    store.write(snap("2026-10-08T00:30:00Z"));
    expect(store.readLatest()?.generatedAt).toBe("2026-10-08T00:30:00Z");
  });

  it("falls through to the previous snapshot when the newest row is corrupt", () => {
    const store = open();
    store.write(snap("2026-10-08T00:00:00Z"));
    store.db.exec(
      `INSERT INTO snapshots (generated_at, payload) VALUES ('bad', '{"generatedAt":123}')`,
    );
    expect(store.readLatest()?.generatedAt).toBe("2026-10-08T00:00:00Z");
  });
});
