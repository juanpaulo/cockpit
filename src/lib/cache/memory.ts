import type { Cache } from "./types";

interface Entry {
  value: unknown;
  expiresAt?: number;
}

// SQLite-backed cache lands with the Investments step; this covers the
// SensorContext contract until then and in tests.
export class MemoryCache implements Cache {
  private store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds === undefined ? undefined : Date.now() + ttlSeconds * 1000,
    });
  }
}
