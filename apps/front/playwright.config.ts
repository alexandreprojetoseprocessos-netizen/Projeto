import { defineConfig } from "@playwright/test";

const webBaseURL = process.env.E2E_WEB_BASE_URL || "http://127.0.0.1:5173";
const apiBaseURL = process.env.E2E_API_BASE_URL || "http://127.0.0.1:4000";
const outputDir = process.env.E2E_OUTPUT_DIR || "./.playwright-results";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 90_000,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: webBaseURL
  },
  webServer: [
    {
      command: "npm --prefix ../api run dev",
      url: `${apiBaseURL}/health`,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      url: webBaseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: apiBaseURL
      } as Record<string, string>
    }
  ]
});
