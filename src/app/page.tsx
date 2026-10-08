import { connection } from "next/server";
import { Suspense } from "react";
import { SensorInstrument } from "@/components/instruments";
import { Shell } from "@/components/layout/shell";
import { timeOfDay } from "@/lib/format";
import { loadDashboard } from "@/lib/cockpit";

async function Overview() {
  await connection();
  const dashboard = await loadDashboard();
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
      {dashboard.nextEvent && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Next: <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {dashboard.nextEvent.title}
          </span>{" "}
          at {timeOfDay(dashboard.nextEvent.timestamp)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.sections.map((section) => (
          <section key={section.segment.id} className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {section.segment.name}
            </h2>
            {section.results.map(({ sensor, result }) => (
              <SensorInstrument
                key={sensor.id}
                sensor={sensor}
                result={result}
                now={now}
              />
            ))}
          </section>
        ))}
      </div>
    </Shell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Overview />
    </Suspense>
  );
}
