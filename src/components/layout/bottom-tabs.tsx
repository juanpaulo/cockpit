"use client";

import { useEffect, useState } from "react";

export interface TabTarget {
  id: string;
  label: string;
}

const ICONS: Record<string, React.ReactNode> = {
  "needs-you": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
    </svg>
  ),
  "flight-plan": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  ),
  comms: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  "home-sys": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 11l8-7 8 7v9H4z" />
    </svg>
  ),
  market: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
    </svg>
  ),
};

/** Fixed bottom section nav (mobile only); active tab follows scroll. */
export function BottomTabs({ targets }: { targets: TabTarget[] }) {
  const [active, setActive] = useState(targets[0]?.id);
  useEffect(() => {
    const onScroll = () => {
      let current = targets[0]?.id;
      for (const t of targets) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = t.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targets]);

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-10 grid auto-cols-fr grid-flow-col border-t border-line bg-panel px-2 pb-6 pt-2 font-mono lg:hidden"
    >
      {targets.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          className={`flex min-h-12 flex-col items-center justify-center gap-[3px] text-[10px] tracking-[0.08em] ${
            active === t.id ? "text-caution" : "text-muted"
          }`}
        >
          {ICONS[t.id]}
          {t.label}
        </a>
      ))}
    </nav>
  );
}
