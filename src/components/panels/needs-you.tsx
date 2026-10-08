import type { NeedItem } from "@/lib/view";

const SEV: Record<string, { dot: string; chip: string }> = {
  warning: {
    dot: "bg-warning",
    chip: "border-warning/50 bg-warning/10 text-warning",
  },
  caution: {
    dot: "bg-caution",
    chip: "border-caution/45 bg-caution/8 text-caution",
  },
  advisory: {
    dot: "bg-advisory",
    chip: "border-line-card bg-transparent text-advisory",
  },
};

export function NeedsYou({
  items,
  overflow,
}: {
  items: NeedItem[];
  overflow: number;
}) {
  const hasWarning = items.some((i) => i.status === "warning");
  const lit = items.length > 0;
  return (
    <section
      id="needs-you"
      aria-label="Needs you"
      className={`flex scroll-mt-4 flex-wrap items-center gap-2.5 rounded-[10px] border p-3 sm:px-4 ${
        lit
          ? "border-caution/60 bg-caution/5"
          : "border-line bg-panel"
      }`}
    >
      <span
        className={`flex min-h-11 min-w-[92px] flex-col items-center justify-center rounded border bg-readout px-2 py-0.5 font-mono ${
          lit
            ? "border-caution text-caution shadow-[0_0_10px_rgba(242,179,61,0.35),inset_0_0_8px_rgba(242,179,61,0.18)]"
            : "border-line-card text-faint"
        }`}
      >
        <span className="text-[10px] font-bold tracking-[0.14em]">MASTER CAUT</span>
        <span
          className={`text-base font-bold leading-tight ${hasWarning ? "text-warning" : lit ? "text-caution" : "text-faint"}`}
        >
          {lit ? `NEEDS YOU ${items.length + overflow}` : "ALL CLEAR"}
        </span>
      </span>
      {items.map((n) => {
        const sev = SEV[n.status];
        return (
          <a
            key={n.id}
            href={n.url || "#"}
            className={`flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 no-underline ${sev.chip.split(" ").slice(0, 2).join(" ")}`}
          >
            <span className={`h-[7px] w-[7px] rounded-full ${sev.dot}`} />
            <span className="text-sm text-text">{n.title}</span>
            <span className={`font-mono text-xs ${sev.chip.split(" ").pop()}`}>{n.due}</span>
          </a>
        );
      })}
      {overflow > 0 && (
        <span className="flex min-h-8 items-center rounded-full border border-line-card px-3 font-mono text-xs text-muted">
          +{overflow}
        </span>
      )}
    </section>
  );
}
