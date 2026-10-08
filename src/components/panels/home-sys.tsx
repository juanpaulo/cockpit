import type { Readout } from "@/lib/readouts/types";
import type { SensorResult } from "@/lib/sensors/types";
import { hhmm } from "@/lib/format";
import { Panel } from "@/components/ui/panel";

const ROW: Record<string, string> = {
  warning: "border-l-warning bg-warning/10 text-warning",
  caution: "border-l-caution bg-caution/[0.07] text-caution",
  advisory: "border-l-transparent bg-transparent text-ok",
};

export function HomeSysPanel({
  devices,
  result,
}: {
  devices: Readout[];
  result?: SensorResult;
}) {
  const ok = result?.ok !== false;
  const cautions = devices.filter((d) => d.status !== "advisory").length;
  return (
    <Panel
      id="home-sys"
      title="HOME SYS"
      right={
        cautions > 0 ? (
          <span className="text-caution">{cautions} CAUT</span>
        ) : (
          <span className="text-ok">ALL NORMAL</span>
        )
      }
    >
      {!ok && (
        <p className="py-1 text-sm text-muted">
          Home Assistant unavailable — {result && !result.ok ? result.error.message : ""}
        </p>
      )}
      {ok && devices.length === 0 && (
        <p className="py-1 text-sm text-muted">All clear.</p>
      )}
      <div className="flex flex-col gap-[2px]">
        {devices.map((d) => {
          const row = ROW[d.status];
          const [border, bg, color] = row.split(" ");
          return (
            <div
              key={d.id}
              className={`grid grid-cols-[1fr_auto_46px] items-center gap-2.5 rounded-md border-l-[3px] px-2.5 py-[9px] ${border} ${bg}`}
            >
              <span className="flex flex-col">
                <span className="text-sm text-text">{d.title}</span>
                {d.subtitle && <span className="text-xs text-muted">{d.subtitle}</span>}
              </span>
              <span className={`font-mono text-[13px] font-bold ${color}`}>
                {String(d.meta?.state ?? "")}
                {d.meta?.unit ? (
                  <span className="font-normal text-cyan">{String(d.meta.unit)}</span>
                ) : null}
              </span>
              <span className="text-right font-mono text-[11px] text-muted">
                {hhmm(d.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
