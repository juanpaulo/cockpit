import type { ReactNode } from "react";

export function Card({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {updatedAt && (
          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
            {updatedAt}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
