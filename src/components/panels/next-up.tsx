import type { Readout } from "@/lib/readouts/types";
import { eventRange } from "@/lib/format";
import { Countdown } from "@/components/layout/clock";

/** Mobile hero card for the next event (hidden on lg+ — the header shows it). */
export function NextUpCard({ event }: { event: Readout }) {
  const end = typeof event.meta?.end === "string" ? event.meta.end : undefined;
  const c = "absolute w-3 h-3 border-bezel pointer-events-none";
  return (
    <section
      aria-label="Next up"
      className="relative flex flex-col gap-2 rounded-xl border border-[#2A3A56] bg-raised px-4 py-3.5 lg:hidden"
    >
      <span aria-hidden className={`${c} -top-px -left-px rounded-tl-xl border-t-2 border-l-2`} />
      <span aria-hidden className={`${c} -top-px -right-px rounded-tr-xl border-t-2 border-r-2`} />
      <span aria-hidden className={`${c} -bottom-px -left-px rounded-bl-xl border-b-2 border-l-2`} />
      <span aria-hidden className={`${c} -bottom-px -right-px rounded-br-xl border-b-2 border-r-2`} />
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] tracking-[0.12em] text-magenta">
            NEXT WPT · {eventRange(event.timestamp, end)}
          </span>
          <span className="text-[22px] font-semibold leading-tight">{event.title}</span>
        </div>
        <div className="flex flex-col items-end rounded border border-line-card bg-readout px-2.5 py-1 font-mono">
          <span className="text-[9px] tracking-[0.14em] text-muted">STARTS</span>
          <span className="text-[22px] leading-[1.1]">
            <Countdown to={event.timestamp} />
          </span>
        </div>
      </div>
      {event.subtitle && <span className="text-[13px] text-text-2">{event.subtitle}</span>}
    </section>
  );
}
