import type { PlanView } from "@/lib/view";
import type { Readout } from "@/lib/readouts/types";
import type { SensorResult } from "@/lib/sensors/types";
import { eventRange, hhmm } from "@/lib/format";
import { Panel } from "@/components/ui/panel";
import { NowLine } from "./now-line";

export function FlightPlanPanel({
  view,
  result,
}: {
  view: PlanView;
  result?: SensorResult;
}) {
  const ok = result?.ok !== false;
  return (
    <Panel
      id="flight-plan"
      title="FLIGHT PLAN · TODAY"
      right={`${view.events.length} EVT · ${view.leftToday} LEFT`}
    >
      {!ok && (
        <p className="py-1 text-sm text-muted">
          Calendar unavailable — {result && !result.ok ? result.error.message : ""}
        </p>
      )}
      {ok && view.events.length === 0 && (
        <p className="py-1 text-sm text-muted">Nothing left today.</p>
      )}
      {/* Past events: collapsed on mobile, dimmed on lg+. */}
      {view.pastTitles.length > 0 && (
        <details className="lg:hidden">
          <summary className="min-h-9 text-[13px] text-muted">
            {view.pastTitles.length} earlier · {view.pastTitles.join(", ")}{" "}
            <span className="disclosure-chevron">›</span>
          </summary>
          {view.events
            .filter((e) => e.isPast)
            .map((e) => (
              <EventRow key={e.readout.id} e={e} />
            ))}
        </details>
      )}
      <div className="hidden lg:block">
        {view.events.filter((e) => e.isPast).map((e) => (
          <EventRow key={e.readout.id} e={e} />
        ))}
      </div>
      {view.leftToday > 0 && <NowLine />}
      {view.events
        .filter((e) => !e.isPast)
        .map((e) => (
          <EventRow key={e.readout.id} e={e} />
        ))}
    </Panel>
  );
}

function EventRow({ e }: { e: PlanView["events"][number] }) {
  const r: Readout = e.readout;
  const end = typeof r.meta?.end === "string" ? r.meta.end : undefined;
  const note = typeof r.meta?.note === "string" ? r.meta.note : undefined;
  const noteStatus = r.meta?.noteStatus === "caution" ? "caution" : "advisory";
  return (
    <div
      className={`grid grid-cols-[52px_1fr] gap-2.5 border-b border-line-soft py-2.5 last:border-b-0 sm:grid-cols-[110px_1fr] ${
        e.isPast ? "opacity-45" : ""
      }`}
    >
      <span
        className={`font-mono text-[13px] ${e.isNext ? "text-magenta" : "text-text-2"}`}
      >
        <span className="sm:hidden">{hhmm(r.timestamp)}</span>
        <span className="hidden sm:inline">{eventRange(r.timestamp, end)}</span>
      </span>
      <div className="flex flex-col gap-[3px]">
        <span className={`text-[15px] ${e.isNext ? "font-semibold" : "font-medium"}`}>
          {r.title}
        </span>
        {(r.meta?.location || r.subtitle) && (
          <span className="text-xs text-muted">
            {String(r.meta?.location ?? r.subtitle ?? "")}
          </span>
        )}
        {note && (
          <span
            className={`text-xs ${e.isNext ? "text-magenta" : noteStatus === "caution" ? "text-caution" : "text-muted"}`}
          >
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
