import type { ReadoutStatus } from "@/lib/readouts/types";

const STYLES: Record<ReadoutStatus, string> = {
  advisory:
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  caution:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  warning:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function StatusDot({ status }: { status: ReadoutStatus }) {
  const color =
    status === "warning"
      ? "bg-red-500"
      : status === "caution"
        ? "bg-amber-500"
        : "bg-zinc-300 dark:bg-zinc-600";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

export function StatusBadge({
  status,
  children,
}: {
  status: ReadoutStatus;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {children}
    </span>
  );
}
