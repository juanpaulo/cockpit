import type { SourceHealth } from "@/lib/view";
import { hhmm } from "@/lib/format";

export function SysStrip({
  sources,
  syncAt,
}: {
  sources: SourceHealth[];
  syncAt: string;
}) {
  return (
    <footer className="flex flex-wrap justify-between gap-3 rounded-md border border-line-soft bg-readout px-3.5 py-2 font-mono text-[10px] tracking-[0.1em] text-muted sm:text-[11px]">
      <span>SYNC {hhmm(syncAt)} · READ-ONLY</span>
      <span className="flex flex-wrap gap-2 sm:gap-3.5">
        {sources.map((s) => (
          <span key={s.id} className={s.ok ? "text-ok" : "text-warning"}>
            ● {s.label}
          </span>
        ))}
      </span>
    </footer>
  );
}
