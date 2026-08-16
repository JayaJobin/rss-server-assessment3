import { defineConfig } from '@playwright/test';

// Assumes `docker-compose up -d --build` has already been run, exposing:
//   frontend -> http://localhost:3000
//   api      -> http://localhost:4000
// Update API_BASE_URL / FRONTEND_BASE_URL below (or the equivalent env vars)
// if you're running Playwright against a remote EC2 host instead of locally.
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
