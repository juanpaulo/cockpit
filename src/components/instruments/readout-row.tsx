import { relativeTime } from "@/lib/format";
import type { Readout } from "@/lib/readouts/types";
import { StatusDot } from "@/components/ui/badge";

export function ReadoutRow({ readout, now }: { readout: Readout; now: Date }) {
  const inner = (
    <>
      <StatusDot status={readout.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
          {readout.title}
        </p>
        {readout.subtitle && (
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {readout.subtitle}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
        {relativeTime(readout.timestamp, now)}
      </span>
    </>
  );

  const cls = "flex items-start gap-2 py-2 first:pt-0 last:pb-0";
  return readout.url ? (
    <a href={readout.url} className={`${cls} hover:opacity-80`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
