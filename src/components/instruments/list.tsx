import { Card } from "@/components/ui/card";
import type { Readout } from "@/lib/readouts/types";
import { ReadoutRow } from "./readout-row";

/** Default instrument: a plain list of readouts. */
export function ListInstrument({
  title,
  readouts,
  updatedAt,
  now,
}: {
  title: string;
  readouts: Readout[];
  updatedAt: string;
  now: Date;
}) {
  return (
    <Card title={title} updatedAt={updatedAt}>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {readouts.map((r) => (
          <ReadoutRow key={r.id} readout={r} now={now} />
        ))}
      </div>
    </Card>
  );
}
