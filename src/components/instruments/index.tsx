import type { Readout } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { timeOfDay } from "@/lib/format";
import { ErrorInstrument } from "./error";
import { InvestmentInstrument } from "./investment";
import { ListInstrument } from "./list";

export function SensorInstrument({
  sensor,
  result,
  now,
}: {
  sensor: Sensor;
  result: SensorResult;
  now: Date;
}) {
  if (!result.ok) {
    return (
      <ErrorInstrument
        title={sensor.name}
        message={result.error.message}
        fetchedAt={result.fetchedAt}
      />
    );
  }
  const readouts: Readout[] = result.readouts;
  const updatedAt = `as of ${timeOfDay(result.fetchedAt)}`;
  if (sensor.id === "investment") {
    return (
      <InvestmentInstrument readouts={readouts} updatedAt={updatedAt} now={now} />
    );
  }
  return (
    <ListInstrument
      title={sensor.name}
      readouts={readouts}
      updatedAt={updatedAt}
      now={now}
    />
  );
}
