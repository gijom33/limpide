import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// Which build is running, for the About splash: the version, and the commit and day it was built from (the
// version alone stays the same from one deploy to the next).
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
})();
const build = {
  version: JSON.parse(readFileSync('package.json', 'utf8')).version as string,
  commit,
  date: new Date().toISOString().slice(0, 10),
};

// Visits to the published site are counted by GoatCounter (no cookies, no personal data); only in the production
// build, so development and the tests (built in 'e2e' mode) never count.
const goatCounter = {
  name: 'goatcounter',
  apply: (_: unknown, { command, mode }: { command: string; mode: string }) => command === 'build' && mode === 'production',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: { 'data-goatcounter': 'https://gijom33.goatcounter.com/count', async: true, src: 'https://gc.zgo.at/count.js' },
      injectTo: 'body' as const,
    },
  ],
};

export default defineConfig({
  plugins: [react(), goatCounter],
  define: { __BUILD__: JSON.stringify(build) },
  // Relative asset URLs, so the build works under GitHub Pages' /limpide/ as well as at a root.
  base: './',
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'engine',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
