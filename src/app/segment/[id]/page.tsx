import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SensorInstrument } from "@/components/instruments";
import { Shell } from "@/components/layout/shell";
import { currentProfile } from "@/lib/auth/current-profile";
import { loadAppConfig } from "@/lib/config/app-config";
import { loadDashboard } from "@/lib/cockpit";
import { visibleSegments } from "@/lib/profiles/model";

// Dynamic segment id — the route can't be prerendered.
export const instant = false;

async function SegmentView({ id }: { id: string }) {
  await connection();
  const dashboard = await loadDashboard(id);
  const now = new Date();

  return (
    <Shell
      segments={dashboard.segments.map((s) => ({
        id: s.id,
        name: s.name,
        counts: dashboard.counts[s.id] ?? {
          unread: 0,
          eventsToday: 0,
          tasksDue: 0,
        },
      }))}
      profileName={dashboard.profile?.name}
      dataMode={dashboard.dataMode}
    >
      {dashboard.sections.map((section) => (
        <section key={section.segment.id}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            {section.segment.name}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {section.results.map(({ sensor, result }) => (
              <SensorInstrument
                key={sensor.id}
                sensor={sensor}
                result={result}
                now={now}
              />
            ))}
          </div>
          {section.results.length === 0 && (
            <p className="text-sm text-zinc-400">Nothing here right now.</p>
          )}
        </section>
      ))}
    </Shell>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  // Validate before streaming so unknown ids return a real 404.
  const config = loadAppConfig();
  const profile = currentProfile(config);
  const visible = profile ? visibleSegments(config.segments, profile) : [];
  if (!visible.some((s) => s.id === id)) {
    notFound();
  }
  return (
    <Suspense fallback={null}>
      <SegmentView id={id} />
    </Suspense>
  );
}
