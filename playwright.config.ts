import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // On CI a failure is retried once, so a browser that crashes under it (WebKit's "Cannot find parent object", seen
  // locally) doesn't block a deploy; a real failure fails twice. Locally, never.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:5199',
    // Every test but the welcome's own starts in a browser that has been welcomed already, so About's welcome
    // never stands over the page (e2e/welcome.spec.ts starts from an empty one).
    storageState: {
      cookies: [],
      origins: [{ origin: 'http://localhost:5199', localStorage: [{ name: 'limpide.welcomed', value: '1' }] }],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari has no Web MIDI but must still play and behave well (WebKit is Safari's engine).
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // The tests run against the built site, as published: one bundle per page load, so pages open quickly even when
  // the whole suite keeps the machine busy (the dev server's many small modules made loads crawl). Built in its own
  // mode, which leaves out the visit counter, and into its own folder: built into `dist`, it replaced the counted
  // build the deploy publishes, and the site counted no visits from 2026-10-26 to 2026-10-28.
  webServer: {
    command: 'npx vite build --mode e2e --outDir dist-e2e --logLevel warn && npx vite preview --mode e2e --outDir dist-e2e --port 5199 --strictPort',
    url: 'http://localhost:5199',
    // Never another run's server: it stops when that run ends, and every test left fails to connect (715 did, the
    // retro of 2026-10-28). A second run fails at once on the busy port instead (one run at a time: CLAUDE.md).
    reuseExistingServer: false,
  },
});
