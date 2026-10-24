import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5199' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari has no Web MIDI but must still play and behave well (WebKit is Safari's engine).
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // The tests run against the built site, as published: one bundle per page load, so pages open quickly even when
  // the whole suite keeps the machine busy (the dev server's many small modules made loads crawl). Built in its own
  // mode, which leaves out the visit counter.
  webServer: {
    command: 'npx vite build --mode e2e --logLevel warn && npx vite preview --mode e2e --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
  },
});
