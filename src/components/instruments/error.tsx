import { Card } from "@/components/ui/card";
import { timeOfDay } from "@/lib/format";

export function ErrorInstrument({
  title,
  message,
  fetchedAt,
}: {
  title: string;
  message: string;
  fetchedAt: string;
}) {
  return (
    <Card title={title} updatedAt={`as of ${timeOfDay(fetchedAt)}`}>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </Card>
  );
}
