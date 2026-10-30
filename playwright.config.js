import { defineConfig, devices } from '@playwright/test';

// Keep browser downloads project-local, including in CI.
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

export default defineConfig({
  testDir: './frontend/e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'npm --prefix frontend run dev -- --port 4175 --strictPort --mode e2e',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
