import { SensorError } from "@/lib/errors";
import { MockCalendarSensor } from "@/lib/mocks/calendar";
import { MockGmailSensor } from "@/lib/mocks/gmail";
import { MockHomeAssistantSensor } from "@/lib/mocks/home-assistant";
import { MockInvestmentSensor } from "@/lib/mocks/investment";
import { MockNotionTasksSensor } from "@/lib/mocks/notion-tasks";
import { MockWeatherSensor } from "@/lib/mocks/weather";
import type { AppConfig } from "@/lib/config/app-config";
import type { SourceId } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "./types";

const MOCK_SENSORS: Record<SourceId, () => Sensor> = {
  gmail: () => new MockGmailSensor(),
  calendar: () => new MockCalendarSensor(),
  "notion-task": () => new MockNotionTasksSensor(),
  investment: () => new MockInvestmentSensor(),
  "home-assistant": () => new MockHomeAssistantSensor(),
  weather: () => new MockWeatherSensor(),
};

const NAMES: Record<SourceId, string> = {
  gmail: "Gmail",
  calendar: "Calendar",
  "notion-task": "Notion tasks",
  investment: "Investments",
  "home-assistant": "Home Assistant",
  weather: "Weather",
};

// Placeholder for sources whose live adapter lands in a later build step.
class PendingSensor implements Sensor {
  constructor(readonly id: SourceId) {}
  get name() {
    return NAMES[this.id];
  }
  async fetchReadouts(): Promise<SensorResult> {
    return {
      ok: false,
      error: new SensorError(
        `${this.name} live sensor is not implemented yet; run DATA_MODE=mock or add "${this.id}" to MOCK_SENSORS.`,
        "not_implemented",
      ),
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function getSensors(config: AppConfig): Sensor[] {
  const ids = Object.keys(MOCK_SENSORS) as SourceId[];
  return ids.map((id) =>
    config.dataMode === "mock" || config.mockSensors.includes(id)
      ? MOCK_SENSORS[id]()
      : new PendingSensor(id),
  );
}
