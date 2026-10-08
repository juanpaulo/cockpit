"use client";

import { useEffect, useState } from "react";

function useNow(stepMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Ticking wall-clock value, green. */
export function TickingClock() {
  const now = useNow();
  return <>{hhmm(now)}</>;
}

/** Magenta countdown "T−HH:MM" to a target instant. */
export function Countdown({ to }: { to: string }) {
  const now = useNow();
  const ms = Math.max(0, new Date(to).getTime() - now.getTime());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <span className="text-magenta">
      T−{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
    </span>
  );
}
