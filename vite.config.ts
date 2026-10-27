import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

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

// Visits to the published site are counted by GoatCounter: no cookies, no personal data stored. Only where the deploy
// gives its address (`.github/workflows/deploy.yml`), so a fork, development and the tests never count, and never on
// the owner's account (issue 42's legal review).
const counterUrl = process.env.GOATCOUNTER_URL ?? '';
const goatCounter = {
  name: 'goatcounter',
  apply: (_: unknown, { command }: { command: string }) => command === 'build' && counterUrl !== '',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: { 'data-goatcounter': counterUrl, async: true, src: 'https://gc.zgo.at/count.js' },
      injectTo: 'body' as const,
    },
  ],
};

// The licences of the code the site ships besides its own (React and what it needs), written beside the page as
// third-party-notices.txt and linked from About: the minified bundle drops their notices, which MIT asks to keep.
function shippedPackages(names: string[], found = new Set<string>()): Set<string> {
  for (const name of names) {
    if (found.has(name)) continue;
    found.add(name);
    const manifest = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
    shippedPackages(Object.keys(manifest.dependencies ?? {}), found);
  }
  return found;
}
// Code a package carries from elsewhere names its licence in a comment of its production files (react-dom: Modernizr).
function bundledNotices(name: string): string {
  const dir = `node_modules/${name}/cjs`;
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.production.js')) : [];
  const notices = new Set<string>();
  for (const f of files)
    for (const [, body] of readFileSync(`${dir}/${f}`, 'utf8').matchAll(/\/\*([^*]*\|\s*MIT[^*]*)\*\//g)) notices.add(body.trim());
  return [...notices].map((n) => `\n\nIt includes ${n}.`).join('');
}
const thirdPartyNotices = {
  name: 'third-party-notices',
  apply: 'build' as const,
  generateBundle(this: { emitFile(file: { type: 'asset'; fileName: string; source: string }): void }) {
    const direct = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).dependencies ?? {});
    const sections = [...shippedPackages(direct)].sort().map((name) => {
      const { version, license } = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
      const file = readdirSync(`node_modules/${name}`).find((f) => /^licen[cs]e/i.test(f));
      const text = file ? readFileSync(`node_modules/${name}/${file}`, 'utf8').trim() : `License: ${license}`;
      return `${name} ${version}\n\n${text}${bundledNotices(name)}`;
    });
    const source = `${['Limpide includes the following third-party software.', ...sections].join(`\n\n${'-'.repeat(72)}\n\n`)}\n`;
    this.emitFile({ type: 'asset', fileName: 'third-party-notices.txt', source });
  },
};

export default defineConfig({
  plugins: [react(), goatCounter, thirdPartyNotices],
  define: { __BUILD__: JSON.stringify({ ...build, counted: counterUrl !== '' }) },
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
