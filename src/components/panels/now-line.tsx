"use client";

import { useEffect, useState } from "react";

/** Cyan NOW rule that ticks every minute. */
export function NowLine() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-2 py-1" aria-hidden>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M1 1 L11 6 L1 11 Z" fill="var(--color-cyan)" />
      </svg>
      <span className="font-mono text-xs text-cyan">NOW {hhmm}</span>
      <span className="h-px flex-1 bg-cyan opacity-60" />
    </div>
  );
}
