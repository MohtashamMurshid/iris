import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.IRIS_E2E_BASE_URL ?? "http://localhost:4175",
    viewport: { width: 390, height: 844 },
    permissions: ["camera"],
    launchOptions: {
      args: [
        "--no-sandbox",
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.IRIS_E2E_BASE_URL
    ? undefined
    : {
        command: "npx expo serve --port 4175",
        url: "http://localhost:4175",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
