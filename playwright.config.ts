import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  retries: 1,
  globalSetup: "./scripts/e2e-setup.mjs",
  globalTeardown: "./scripts/e2e-teardown.mjs",
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
