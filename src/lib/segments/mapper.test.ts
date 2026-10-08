import { describe, expect, it } from "vitest";
import type { Readout, SourceId } from "@/lib/readouts/types";
import { resolveSegmentId, resolveSegments } from "./mapper";
import type { Segment } from "./model";

const segments: Segment[] = [
  {
    id: "family",
    name: "Family",
    gmail_labels: ["Cockpit/Family"],
    calendars: ["Family"],
    notion_values: ["Family"],
  },
  {
    id: "investments",
    name: "Investments",
    gmail_labels: ["Cockpit/Investments"],
    calendars: [],
    notion_values: ["Investments"],
  },
  { id: "home", name: "Home Automation", gmail_labels: [], calendars: [], notion_values: [] },
  { id: "general", name: "General", gmail_labels: [], calendars: [], notion_values: [], default: true },
];

function readout(source: SourceId, meta?: Record<string, unknown>): Readout {
  return {
    id: `${source}:1`,
    source,
    segment: "",
    title: "t",
    timestamp: "2026-01-01T00:00:00Z",
    url: "",
    status: "advisory",
    meta,
  };
}

describe("resolveSegmentId", () => {
  it("maps gmail labels to segments", () => {
    expect(
      resolveSegmentId(readout("gmail", { labels: ["INBOX", "Cockpit/Family"] }), segments),
    ).toBe("family");
    expect(
      resolveSegmentId(readout("gmail", { labels: ["Cockpit/Investments"] }), segments),
    ).toBe("investments");
  });

  it("maps calendar names to segments", () => {
    expect(resolveSegmentId(readout("calendar", { calendar: "Family" }), segments)).toBe(
      "family",
    );
  });

  it("maps notion Segment values to segments", () => {
    expect(
      resolveSegmentId(readout("notion-task", { notionSegment: "Investments" }), segments),
    ).toBe("investments");
  });

  it("fixes investments and home-assistant to their segments", () => {
    expect(resolveSegmentId(readout("investment"), segments)).toBe("investments");
    expect(resolveSegmentId(readout("home-assistant"), segments)).toBe("home");
  });

  it("drops untagged items into the default segment", () => {
    expect(resolveSegmentId(readout("gmail", { labels: ["INBOX"] }), segments)).toBe(
      "general",
    );
    expect(resolveSegmentId(readout("calendar", { calendar: "Unknown" }), segments)).toBe(
      "general",
    );
    expect(resolveSegmentId(readout("notion-task", { notionSegment: null }), segments)).toBe(
      "general",
    );
  });
});

describe("resolveSegments", () => {
  it("assigns every readout a segment", () => {
    const out = resolveSegments([readout("gmail"), readout("investment")], segments);
    expect(out.map((r) => r.segment)).toEqual(["general", "investments"]);
  });
});
