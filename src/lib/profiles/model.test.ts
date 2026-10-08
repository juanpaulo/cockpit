import { describe, expect, it } from "vitest";
import type { Readout } from "@/lib/readouts/types";
import type { Segment } from "@/lib/segments/model";
import { filterReadouts, visibleSegments, type Profile } from "./model";

const owner: Profile = {
  id: "owner",
  name: "Owner",
  emails: ["o@example.com"],
  segments: ["*"],
};

const family: Profile = {
  id: "family",
  name: "Family member",
  emails: ["f@example.com"],
  segments: ["family"],
};

const segments: Segment[] = [
  { id: "family", name: "Family", gmail_labels: [], calendars: [], notion_values: [] },
  { id: "investments", name: "Investments", gmail_labels: [], calendars: [], notion_values: [] },
  { id: "general", name: "General", gmail_labels: [], calendars: [], notion_values: [], default: true },
];

function readout(segment: string): Readout {
  return {
    id: `gmail:${segment}`,
    source: "gmail",
    segment,
    title: segment,
    timestamp: "2026-01-01T00:00:00Z",
    url: "",
    status: "advisory",
  };
}

const readouts = [readout("family"), readout("investments"), readout("general")];

describe("filterReadouts", () => {
  it("gives a wildcard profile everything", () => {
    expect(filterReadouts(readouts, owner)).toHaveLength(3);
  });

  it("restricts a scoped profile to its segments", () => {
    const out = filterReadouts(readouts, family);
    expect(out.map((r) => r.segment)).toEqual(["family"]);
  });
});

describe("visibleSegments", () => {
  it("mirrors the same scoping for navigation", () => {
    expect(visibleSegments(segments, owner)).toHaveLength(3);
    expect(visibleSegments(segments, family).map((s) => s.id)).toEqual(["family"]);
  });
});
