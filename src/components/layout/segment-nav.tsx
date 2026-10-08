"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavSegment {
  id: string;
  name: string;
  counts: { unread: number; eventsToday: number; tasksDue: number };
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors lg:rounded-lg lg:px-3 lg:py-2 ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </Link>
  );
}

export function SegmentNav({
  segments,
  variant,
}: {
  segments: NavSegment[];
  variant: "tabs" | "sidebar";
}) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Today", badge: null as string | null },
    ...segments.map((s) => {
      const total = s.counts.unread + s.counts.eventsToday + s.counts.tasksDue;
      return {
        href: `/segment/${s.id}`,
        label: s.name,
        badge: total > 0 ? String(total) : null,
      };
    }),
  ];

  if (variant === "tabs") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} active={pathname === l.href}>
            {l.label}
            {l.badge && <span className="ml-1 opacity-70">{l.badge}</span>}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
      {links.map((l) => (
        <NavLink key={l.href} href={l.href} active={pathname === l.href}>
          <span className="flex items-center justify-between">
            {l.label}
            {l.badge && <span className="text-xs opacity-70">{l.badge}</span>}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
