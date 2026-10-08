import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100/api/health",
    env: { DATA_MODE: "mock" },
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
