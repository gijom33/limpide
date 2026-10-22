import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5199' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari has no Web MIDI but must still play and behave well (WebKit is Safari's engine).
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
  },
});
