import type { ReactNode } from "react";

/** Panel with the cockpit corner brackets. */
export function Panel({
  id,
  title,
  right,
  children,
}: {
  id?: string;
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  const c = "absolute w-3 h-3 border-bezel pointer-events-none";
  return (
    <section
      id={id}
      className="relative scroll-mt-4 rounded-[10px] border border-line bg-panel p-4"
    >
      <span aria-hidden className={`${c} -top-px -left-px rounded-tl-[10px] border-t-2 border-l-2`} />
      <span aria-hidden className={`${c} -top-px -right-px rounded-tr-[10px] border-t-2 border-r-2`} />
      <span aria-hidden className={`${c} -bottom-px -left-px rounded-bl-[10px] border-b-2 border-l-2`} />
      <span aria-hidden className={`${c} -bottom-px -right-px rounded-br-[10px] border-b-2 border-r-2`} />
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-sm font-bold tracking-[0.16em] uppercase sm:text-[15px]">
          {title}
        </h2>
        {right && <span className="font-mono text-[11px] text-muted sm:text-xs">{right}</span>}
      </div>
      {children}
    </section>
  );
}

/** Small black readout window (time, weather, countdown). */
export function ReadoutWindow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded border border-line-card bg-readout px-2.5 py-1 font-mono sm:px-3">
      <span className="text-[9px] tracking-[0.14em] text-muted sm:text-[10px]">{label}</span>
      <span className="text-base leading-tight text-ok sm:text-xl">{children}</span>
    </div>
  );
}
