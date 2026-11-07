import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { imageProblem, imageTags, lockedVersions } from './playwrightImage';

const lock = (versions: Record<string, string>) =>
  JSON.stringify({
    packages: Object.fromEntries(Object.entries(versions).map(([name, version]) => [`node_modules/${name}`, { version }])),
  });
const workflow = (tag: string) => `jobs:\n  browsers:\n    container:\n      image: mcr.microsoft.com/playwright:${tag}\n`;
const ALL = (version: string) => ({ playwright: version, 'playwright-core': version, '@playwright/test': version });

describe("Playwright's image against the lock file", () => {
  it('passes when the image names the locked version', () => {
    expect(imageProblem(workflow('v1.64.1-noble'), lock(ALL('1.64.1')))).toBeNull();
  });

  it('fails a Playwright update the image did not follow, saying which to change', () => {
    expect(imageProblem(workflow('v1.64.1-noble'), lock(ALL('1.65.0')))).toBe(
      "Playwright's image in .github/workflows/deploy.yml is v1.64.1-noble, but package-lock.json installs Playwright " +
        "1.65.0: change the image's tag to v1.65.0-noble, or Playwright back to 1.64.1.",
    );
  });

  it('fails when the lock file holds Playwright at two versions', () => {
    expect(imageProblem(workflow('v1.64.1-noble'), lock({ playwright: '1.64.1', '@playwright/test': '1.65.0' }))).toMatch(
      /more than one version \(playwright 1\.64\.1, @playwright\/test 1\.65\.0\)/,
    );
  });

  it('fails when the workflow names no image, or the lock no Playwright', () => {
    expect(imageProblem('jobs: {}', lock(ALL('1.64.1')))).toMatch(/No Playwright image/);
    expect(imageProblem(workflow('v1.64.1-noble'), lock({}))).toMatch(/installs no Playwright/);
  });

  it('reads the tags and the versions', () => {
    expect(imageTags(workflow('v1.64.1-noble'))).toEqual([{ version: '1.64.1', ubuntu: 'noble' }]);
    expect(lockedVersions(lock({ playwright: '1.64.1' }))).toEqual({ playwright: '1.64.1' });
  });

  it('agrees with the repository as it stands', () => {
    expect(imageProblem(readFileSync('.github/workflows/deploy.yml', 'utf8'), readFileSync('package-lock.json', 'utf8'))).toBeNull();
  });
});
