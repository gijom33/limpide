// GitHub's browser jobs run in Playwright's own image (issue 247), whose tag names a Playwright version by hand. The
// first step of each job runs this check: if the lock file's Playwright has moved and the image has not (or the
// other way round), the run fails before any test, saying which to change, rather than testing one version's browsers
// with another's library.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WORKFLOW = '.github/workflows/deploy.yml';
const LOCK = 'package-lock.json';
const PACKAGES = ['playwright', 'playwright-core', '@playwright/test'];

/** The Playwright versions the lock file installs, by package (only the packages it has). */
export function lockedVersions(lockText: string): Record<string, string> {
  const packages: Record<string, { version?: string }> = JSON.parse(lockText).packages ?? {};
  const versions: Record<string, string> = {};
  for (const name of PACKAGES) {
    const version = packages[`node_modules/${name}`]?.version;
    if (version) versions[name] = version;
  }
  return versions;
}

/** Every Playwright image the workflow names, as its version and its Ubuntu release (`v1.64.1-noble`). */
export function imageTags(workflowText: string): { version: string; ubuntu: string }[] {
  return [...workflowText.matchAll(/mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-([a-z]+)/g)].map((m) => ({
    version: m[1],
    ubuntu: m[2],
  }));
}

/** What is wrong between the workflow's image and the lock file's Playwright, or null when they agree. */
export function imageProblem(workflowText: string, lockText: string): string | null {
  const tags = imageTags(workflowText);
  if (tags.length === 0) return `No Playwright image (mcr.microsoft.com/playwright:vX.Y.Z-…) is named in ${WORKFLOW}.`;
  const locked = lockedVersions(lockText);
  const lockedSet = [...new Set(Object.values(locked))];
  if (lockedSet.length === 0) return `${LOCK} installs no Playwright.`;
  if (lockedSet.length > 1) {
    const list = Object.entries(locked).map(([name, v]) => `${name} ${v}`);
    return `${LOCK} installs Playwright at more than one version (${list.join(', ')}): give them one version, then the image the same.`;
  }
  const [version] = lockedSet;
  const wrong = tags.filter((tag) => tag.version !== version);
  if (wrong.length === 0) return null;
  const named = [...new Set(wrong.map((tag) => `v${tag.version}-${tag.ubuntu}`))].join(', ');
  return (
    `Playwright's image in ${WORKFLOW} is ${named}, but ${LOCK} installs Playwright ${version}: ` +
    `change the image's tag to v${version}-${wrong[0].ubuntu}, or Playwright back to ${wrong[0].version}.`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workflow = WORKFLOW, lock = LOCK] = process.argv.slice(2);
  const problem = imageProblem(readFileSync(workflow, 'utf8'), readFileSync(lock, 'utf8'));
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  console.log(`Playwright's image matches the lock file (Playwright ${imageTags(readFileSync(workflow, 'utf8'))[0].version}).`);
}
