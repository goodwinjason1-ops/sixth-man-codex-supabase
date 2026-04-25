import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1 --port 3003 --mode e2e',
    url: 'http://127.0.0.1:3003',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      VITE_SUPABASE_STORAGE_BUCKET: 'feedback-screenshots',
      VITE_E2E_MOCK_SUPABASE: 'true'
    }
  },
  use: {
    baseURL: 'http://localhost:3003',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
