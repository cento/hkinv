import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60000,
  expect: { timeout: 10000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: "only-on-failure",
    video: "on-first-retry",
    locale: "en",
    timezoneId: "Asia/Hong_Kong",
  },

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
      testIgnore: /mobile/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile/,
    },
    {
      name: "tablet-chromium",
      use: { ...devices["iPad Pro"] },
      testMatch: /mobile/,
    },
  ],

  webServer: {
    command: "npx vite --port 5173 --strictPort --host",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
