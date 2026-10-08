import type { CommsView } from "@/lib/view";
import type { SensorResult } from "@/lib/sensors/types";
import { dueLabel, hhmm } from "@/lib/format";
import { Panel } from "@/components/ui/panel";

const DUE_COLOR: Record<string, string> = {
  warning: "text-warning",
  caution: "text-caution",
  advisory: "text-muted",
};

export function CommsPanel({
  view,
  gmailResult,
  taskResult,
}: {
  view: CommsView;
  gmailResult?: SensorResult;
  taskResult?: SensorResult;
}) {
  const gmailOk = gmailResult?.ok !== false;
  const tasksOk = taskResult?.ok !== false;
  const empty =
    gmailOk && tasksOk && !view.replies.length && !view.fyi.length && !view.tasks.length;
  return (
    <Panel
      id="comms"
      title="COMMS"
      right={`${view.replies.length} RPLY · ${view.fyi.length} FYI · ${view.tasks.length} TSK`}
    >
      {!gmailOk && (
        <p className="py-1 text-sm text-muted">
          Gmail unavailable — {gmailResult && !gmailResult.ok ? gmailResult.error.message : ""}
        </p>
      )}
      {view.replies.length > 0 && (
        <>
          <h3 className="mt-1 font-mono text-[11px] font-bold tracking-[0.14em] text-caution">
            NEEDS REPLY
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {view.replies.map((m) => (
              <a
                key={m.id}
                href={m.url}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 rounded-lg border border-line-card bg-raised px-3 py-2.5 no-underline"
              >
                <span className="text-sm font-medium text-text">
                  {String(m.meta?.from ?? "")} · {m.title}
                </span>
                <span className="font-mono text-xs text-muted">{hhmm(m.timestamp)}</span>
                {m.subtitle && (
                  <span className="col-span-full text-[13px] text-text-2">{m.subtitle}</span>
                )}
              </a>
            ))}
          </div>
        </>
      )}

      {view.fyi.length > 0 && (
        <>
          <h3 className="mt-2 font-mono text-[11px] font-bold tracking-[0.14em] text-muted">
            FYI
          </h3>
          {/* Collapsed on mobile, expanded on lg+. */}
          <details className="lg:hidden">
            <summary className="flex min-h-11 items-center justify-between rounded-lg border border-line px-3 text-sm text-text">
              <span>
                <span className="mr-2 font-mono text-[11px] text-muted">
                  FYI · {view.fyi.length}
                </span>
                {view.fyi
                  .map((m) => String(m.meta?.from ?? ""))
                  .join(", ")}
              </span>
              <span className="disclosure-chevron text-muted">›</span>
            </summary>
            <FyiRows view={view} />
          </details>
          <div className="hidden lg:block">
            <FyiRows view={view} />
          </div>
        </>
      )}

      <h3 className="mt-2 font-mono text-[11px] font-bold tracking-[0.14em] text-muted">
        CHECKLIST
      </h3>
      {!tasksOk && (
        <p className="py-1 text-sm text-muted">
          Notion tasks unavailable — {taskResult && !taskResult.ok ? taskResult.error.message : ""}
        </p>
      )}
      {tasksOk && view.tasks.length === 0 && (
        <p className="py-1 text-sm text-muted">All clear.</p>
      )}
      <div className="flex flex-col">
        {view.tasks.map((t) => {
          const Row = t.url ? "a" : "div";
          return (
            <Row
              key={t.id}
              {...(t.url ? { href: t.url } : {})}
              className="flex min-h-10 items-center gap-2.5 no-underline lg:min-h-0 lg:py-[9px]"
            >
              <span className="h-3.5 w-3.5 flex-none rounded-sm border-[1.5px] border-faint" />
              <span className="text-sm text-text">{t.title}</span>
              <span className="flex-1 border-b border-dotted border-leader" />
              <span className={`font-mono text-xs ${DUE_COLOR[t.status]}`}>
                {dueLabel(t.timestamp, new Date())}
              </span>
            </Row>
          );
        })}
      </div>
      {empty && <p className="py-1 text-sm text-muted">No replies owed.</p>}
    </Panel>
  );
}

function FyiRows({ view }: { view: CommsView }) {
  return (
    <div className="flex flex-col">
      {view.fyi.map((m) => {
        const Row = m.url ? "a" : "div";
        return (
          <Row
            key={m.id}
            {...(m.url ? { href: m.url } : {})}
            className="grid grid-cols-[1fr_auto] gap-3 border-b border-line-soft px-0.5 py-2 text-[13px] no-underline"
          >
            <span className="truncate">
              <span className="text-muted">{String(m.meta?.from ?? "")}</span>
              <span className="text-text-2"> · {m.title}</span>
            </span>
            <span className="font-mono text-xs text-muted">{hhmm(m.timestamp)}</span>
          </Row>
        );
      })}
    </div>
  );
}
