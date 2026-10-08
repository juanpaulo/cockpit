import { dateLabel, jpy, signedPct } from "@/lib/format";
import type { Readout } from "@/lib/readouts/types";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const kind = (r: Readout) => String(r.meta?.kind ?? "holding");

export function InvestmentInstrument({
  readouts,
  updatedAt,
}: {
  readouts: Readout[];
  updatedAt: string;
  now: Date;
}) {
  const total = readouts.find((r) => kind(r) === "total");
  const holdings = readouts.filter((r) => kind(r) === "holding");
  const keyDates = readouts.filter((r) => kind(r) === "key-date");

  return (
    <Card title="Investments" updatedAt={updatedAt}>
      {total && (
        <div className="mb-3">
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {jpy(Number(total.meta?.valueJpy ?? 0))}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {signedPct(Number(total.meta?.dayChangeJpy ?? 0) /
              Math.max(Number(total.meta?.valueJpy ?? 1), 1) * 100)}{" "}
            today
          </p>
        </div>
      )}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {holdings.map((r) => (
          <div key={r.id} className="flex items-start gap-2 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{r.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {r.subtitle}
              </p>
            </div>
            <StatusBadge status={r.status}>
              {signedPct(r.meta?.changePercent as number | undefined)}
            </StatusBadge>
          </div>
        ))}
      </div>
      {keyDates.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Upcoming
          </p>
          {keyDates.map((r) => (
            <div key={r.id} className="flex items-baseline gap-2 py-1 text-sm">
              <span className="w-12 shrink-0 text-xs text-zinc-400">
                {dateLabel(r.timestamp)}
              </span>
              <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
                {r.title}
              </span>
              {r.subtitle && (
                <span className="text-xs text-zinc-400">{r.subtitle}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
