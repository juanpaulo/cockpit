import type { MarketView } from "@/lib/view";
import type { SensorResult } from "@/lib/sensors/types";
import { dueLabel, jpy, signedPct } from "@/lib/format";
import { Panel } from "@/components/ui/panel";

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const mn = Math.min(...points);
  const mx = Math.max(...points);
  const coords = points
    .map(
      (y, i) =>
        `${((i * 72) / (points.length - 1)).toFixed(1)},${(22 - ((y - mn) / (mx - mn || 1)) * 20).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg width="72" height="24" viewBox="0 0 72 24" aria-hidden className="w-14 sm:w-[72px]">
      <polyline
        points={coords}
        fill="none"
        stroke={up ? "var(--color-ok)" : "var(--color-warning)"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function MarketPanel({
  view,
  result,
}: {
  view: MarketView;
  result?: SensorResult;
}) {
  const ok = result?.ok !== false;
  const total = view.total?.meta;
  return (
    <Panel
      id="market"
      title="MARKET"
      right={`${view.holdings.length} HLDG`}
    >
      {!ok && (
        <p className="py-1 text-sm text-muted">
          Market data unavailable — {result && !result.ok ? result.error.message : ""}
        </p>
      )}
      {view.holdings.map((h) => {
        const hasQuote = h.meta?.changePercent !== undefined && h.meta?.currency !== undefined;
        const chg = Number(h.meta?.changePercent ?? 0);
        const up = chg >= 0;
        const Row = h.url ? "a" : "div";
        return (
          <Row
            key={h.id}
            {...(h.url ? { href: h.url } : {})}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2.5 border-b border-line-soft py-[9px] no-underline last:border-b-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-mono text-sm">{h.title}</span>
              <span className="truncate text-xs text-muted">
                {String(h.meta?.name ?? "")}
              </span>
            </span>
            {Array.isArray(h.meta?.spark) && h.meta.spark.length > 1 && (
              <Sparkline points={h.meta.spark as number[]} up={up} />
            )}
            {hasQuote ? (
              <>
                <span
                  className={`text-right font-mono text-[13px] ${up ? "text-ok" : "text-warning"}`}
                >
                  {signedPct(chg)}
                </span>
                <span className="min-w-[84px] text-right font-mono text-[13px]">
                  {jpy(Number(h.meta?.valueJpy ?? 0))}
                </span>
              </>
            ) : (
              <span className="col-span-2 text-right font-mono text-[13px] text-caution">
                NO QUOTE
              </span>
            )}
          </Row>
        );
      })}
      {view.keyDates.map((d) => {
        const Row = d.url ? "a" : "div";
        return (
          <Row
            key={d.id}
            {...(d.url ? { href: d.url } : {})}
            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line-soft py-[9px] text-[13px] no-underline last:border-b-0"
          >
            <span className="truncate text-text-2">{d.title}</span>
            <span
              className={`font-mono text-xs ${d.status === "caution" ? "text-caution" : "text-muted"}`}
            >
              {dueLabel(d.timestamp, new Date())}
            </span>
          </Row>
        );
      })}
      {total && (
        <div className="flex items-baseline justify-between pt-2.5">
          <span className="font-mono text-xs font-bold tracking-[0.14em]">TOTAL</span>
          <span className="font-mono">
            <span
              className={`text-[13px] ${Number(total.dayChangeJpy ?? 0) >= 0 ? "text-ok" : "text-warning"}`}
            >
              {Number(total.dayChangeJpy) >= 0 ? "+" : "−"}
              {jpy(Math.abs(Number(total.dayChangeJpy ?? 0)))} TODAY
            </span>{" "}
            <span className="text-lg">{jpy(Number(total.valueJpy ?? 0))}</span>
          </span>
        </div>
      )}
    </Panel>
  );
}
