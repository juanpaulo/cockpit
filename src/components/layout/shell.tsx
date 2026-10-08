import type { ReactNode } from "react";
import { SegmentNav, type NavSegment } from "./segment-nav";

export function Shell({
  segments,
  profileName,
  dataMode,
  children,
}: {
  segments: NavSegment[];
  profileName?: string;
  dataMode: "mock" | "live";
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Cockpit</h1>
          <div className="flex items-baseline gap-2 text-xs text-zinc-400">
            {dataMode === "mock" && <span>mock data</span>}
            {profileName && <span>{profileName}</span>}
          </div>
        </div>
      </header>
      <SegmentNav segments={segments} variant="tabs" />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-10 pt-4">
        <SegmentNav segments={segments} variant="sidebar" />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
