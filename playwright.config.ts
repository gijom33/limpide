import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5199' },
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
  },
});
