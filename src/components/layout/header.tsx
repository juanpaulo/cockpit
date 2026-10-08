import type { Readout } from "@/lib/readouts/types";
import type { Segment } from "@/lib/segments/model";
import { readoutDate } from "@/lib/format";
import { ReadoutWindow } from "@/components/ui/panel";
import { Countdown, TickingClock } from "./clock";
import { SegmentSwitch } from "./segment-switch";

function CompassIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

export function Header({
  segments,
  weather,
  nextEvent,
  now,
}: {
  segments: Segment[];
  weather?: Readout;
  nextEvent?: Readout;
  now: Date;
}) {
  const tempC = weather ? Number(weather.meta?.tempC) : undefined;
  const condition = weather ? String(weather.meta?.condition ?? "") : undefined;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <CompassIcon size={24} />
          <span className="text-xl font-semibold sm:text-2xl">Cockpit</span>
        </div>
        <div className="w-full sm:w-auto">
          <SegmentSwitch segments={segments} />
        </div>
      </div>
      <div className="flex flex-wrap items-stretch gap-2">
        <ReadoutWindow label={readoutDate(now)}>
          <TickingClock />
        </ReadoutWindow>
        <ReadoutWindow label="WX">
          {tempC !== undefined ? (
            <>
              {tempC}
              <span className="text-[13px] text-cyan">°C</span>{" "}
              <span className="text-sm text-text-2">{condition}</span>
            </>
          ) : (
            "—"
          )}
        </ReadoutWindow>
        {nextEvent && (
          <ReadoutWindow label={`NEXT · ${nextEvent.title.toUpperCase()} ${nextEvent.timestamp.slice(11, 16)}`}>
            <Countdown to={nextEvent.timestamp} />
          </ReadoutWindow>
        )}
      </div>
    </header>
  );
}
