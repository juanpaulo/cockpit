"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SegmentSwitch({ segments }: { segments: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "All" },
    ...segments.map((s) => ({ href: `/segment/${s.id}`, label: s.name })),
  ];
  return (
    <nav
      aria-label="Segment"
      className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg border border-line bg-panel p-[3px]"
    >
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-pressed={active}
            className={`flex min-h-9 items-center justify-center rounded-md px-2 text-[13px] font-medium sm:px-3 sm:text-sm ${
              active ? "bg-line text-cyan" : "text-muted"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
