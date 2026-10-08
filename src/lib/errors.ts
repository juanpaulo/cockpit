export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class SensorError extends Error {
  readonly code: string;

  constructor(message: string, code = "sensor_error") {
    super(message);
    this.name = "SensorError";
    this.code = code;
  }
}
