import { defineConfig } from '@playwright/test';

const port = Number(process.env.LIVE_PLAYWRIGHT_PORT || 3004);
const baseURL = process.env.LIVE_BASE_URL || `http://127.0.0.1:${port}`;
const shouldStartWebServer = !process.env.LIVE_BASE_URL;

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 15000 },
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  webServer: shouldStartWebServer ? {
    command: `npm.cmd run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASE_STORAGE_BUCKET: process.env.VITE_SUPABASE_STORAGE_BUCKET || 'feedback-screenshots'
    }
  } : undefined,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      }
    }
  ]
});
