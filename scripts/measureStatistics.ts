// `npm run stats` (issue 84): measures the project's size, quality and performance for the version in package.json and
// writes its row into docs/statistics.md, before a release's commit (docs/releasing.md).
//
//   npm run stats                      everything: the size, the three suites with coverage, the build, the page load and
//                                      the running app (several minutes; the end-to-end tests use port 5199)
//   npm run stats -- --quick           a check of the command itself: no suites, short timings, the page printed and
//                                      nothing written
//   npm run stats -- --history         the exact numbers of every release tag, each built in a worktree of its own with
//                                      its own locked dependencies (--tags v1.0.0,v1.1.0 for some; --work <dir> for where)
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { cpus, tmpdir, totalmem } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { type Browser, chromium } from 'playwright';
import { preview, runnerImport } from 'vite';
import {
  fileGroup,
  issueCounts,
  lineCount,
  lintCounts,
  playwrightCounts,
  type Row,
  readmeWithSummary,
  STATES,
  type SuiteCounts,
  statisticsPage,
  TIMINGS,
  testSuite,
  testsWritten,
  typeErrorCount,
  vitestCounts,
  withRow,
} from './statistics.ts';

const ROOT = process.cwd();
const ROWS = join(ROOT, 'docs/statistics.json');
const PAGE = join(ROOT, 'docs/statistics.md');
const README = join(ROOT, 'README.md');
/** The built site is served here for the page load and the running app: not the end-to-end tests' 5199. */
const PORT = 5299;

type Values = Row['values'];

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};

const say = (line: string) => console.log(`stats: ${line}`);
const git = (cwd: string, ...gitArgs: string[]) => execFileSync('git', gitArgs, { cwd, encoding: 'utf8' }).trim();
/** Runs a command to its end, failing or not, and says how long it took. */
function run(command: string, commandArgs: string[], cwd = ROOT, env: NodeJS.ProcessEnv = {}) {
  const start = performance.now();
  const result = spawnSync(command, commandArgs, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 1 << 28 });
  return { ...result, seconds: (performance.now() - start) / 1000 };
}

// ——— The exact numbers: the code, its git history and its build, the same on any machine ———

/** Size counts from the files git tracks in `dir`, as they are there. */
async function sizeValues(dir: string): Promise<Values> {
  const files = git(dir, 'ls-files').split('\n').filter((f) => f !== '' && existsSync(join(dir, f)));
  const text = (f: string) => readFileSync(join(dir, f), 'utf8');
  const v: Values = { appLines: 0, appFiles: 0, testsLines: 0, testsFiles: 0, docsLines: 0, docsFiles: 0, unitWritten: 0, engineWritten: 0, e2eWritten: 0 };
  for (const f of files) {
    const group = fileGroup(f);
    if (group) {
      v[`${group}Lines`]! += lineCount(text(f));
      v[`${group}Files`]! += 1;
    }
    const suite = testSuite(f);
    if (suite) v[`${suite}Written`]! += testsWritten(text(f));
  }
  v.testsWritten = v.unitWritten! + v.engineWritten! + v.e2eWritten!;
  const issues = issueCounts(files.filter((f) => /^docs\/issues\/.*\.md$/.test(f)).map(text));
  v.issuesDone = issues.done;
  v.issuesOpen = issues.open;
  v.commits = Number(git(dir, 'rev-list', '--count', 'HEAD'));
  // The Presets and Tutorials as the app holds them: their module loaded through Vite, wherever it is (0 if none).
  const exported = async (name: string) => {
    const file = files.find((f) => /^src\/.*\.tsx?$/.test(f) && text(f).includes(`export const ${name}`));
    if (!file) return 0;
    const { module } = await runnerImport<Record<string, unknown[]>>(join(dir, file), { configFile: false, logLevel: 'error', root: dir });
    return module[name].length;
  };
  v.presets = await exported('PRESETS');
  v.tutorials = await exported('TUTORIALS');
  return v;
}

/** Every file under `dir`. */
const filesIn = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? filesIn(join(dir, name)) : [join(dir, name)]));

/**
 * Builds the site in `dir` into `outDir` with that checkout's own Vite and config, and measures its JavaScript and CSS.
 * The build writes the day it was built into the page (About's splash): it is read as `date`, so the same commit
 * measures the same on any day.
 */
function buildValues(dir: string, outDir: string, date: string): Values {
  const build = run('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], dir);
  if (build.status !== 0) throw new Error(`The build failed in ${dir}:\n${build.stderr}`);
  const today = new Date().toISOString().slice(0, 10);
  const v: Values = { jsBytes: 0, jsGzip: 0, cssBytes: 0, cssGzip: 0 };
  for (const file of filesIn(outDir)) {
    const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : null;
    if (!kind) continue;
    const bytes = Buffer.from(readFileSync(file, 'utf8').replaceAll(today, date));
    v[`${kind}Bytes`]! += bytes.length;
    v[`${kind}Gzip`]! += gzipSync(bytes).length;
  }
  return v;
}

// ——— The suites, the lint and the types ———

/** Coverage of the app code: every file of it, those no test loads included, its tests and their helpers left out. */
const COVERAGE = ['--coverage.enabled', '--coverage.include=src/**/*.{ts,tsx}', '--coverage.exclude=src/test/**', '--coverage.reporter=json-summary'];

interface SuiteRun {
  counts: SuiteCounts | null;
  seconds: number;
}

/** A Vitest project, with coverage, its report and its coverage kept in `work` for merging. */
function vitestSuite(project: 'unit' | 'engine', work: string): SuiteRun {
  say(`the ${project} tests, with coverage…`);
  const report = join(work, `${project}.json`);
  const { seconds } = run('npx', [
    'vitest', 'run', '--project', project,
    '--reporter=blob', `--outputFile.blob=${join(work, 'blobs', `${project}.json`)}`,
    '--reporter=json', `--outputFile.json=${report}`,
    ...COVERAGE, `--coverage.reportsDirectory=${join(work, `coverage-${project}`)}`,
  ]);
  return { counts: existsSync(report) ? vitestCounts(readFileSync(report, 'utf8')) : null, seconds };
}

/** The unit and engine projects' coverage together, from their two reports. */
function mergedCoverage(work: string): Values {
  const dir = join(work, 'coverage');
  run('npx', [
    'vitest', 'run', `--merge-reports=${join(work, 'blobs')}`, '--reporter=dot',
    ...COVERAGE, `--coverage.reportsDirectory=${dir}`,
  ]);
  const file = join(dir, 'coverage-summary.json');
  if (!existsSync(file)) return {};
  const { total } = JSON.parse(readFileSync(file, 'utf8'));
  return { coverageLines: total.lines.pct, coverageBranches: total.branches.pct };
}

function playwrightSuite(work: string): SuiteRun {
  say('the end-to-end tests (port 5199)…');
  const report = join(work, 'e2e.json');
  const { seconds } = run('npx', ['playwright', 'test', '--reporter=json'], ROOT, { PLAYWRIGHT_JSON_OUTPUT_FILE: report });
  return { counts: existsSync(report) ? playwrightCounts(readFileSync(report, 'utf8')) : null, seconds };
}

function suiteValues(id: string, { counts, seconds }: SuiteRun): Values {
  if (!counts) return {};
  return { [`${id}Tests`]: counts.tests, [`${id}Passed`]: counts.passed, [`${id}Seconds`]: seconds };
}

function checkValues(): Values {
  say('the type check and the lint…');
  const tsc = run('npx', ['tsc', '--pretty', 'false']);
  const lint = lintCounts(run('npx', ['biome', 'check', '--reporter=json']).stdout);
  return { typeErrors: typeErrorCount(tsc.stdout), lintErrors: lint.errors, lintWarnings: lint.warnings };
}

// ——— The page load and the running app, in Chromium ———

const VIEWPORT = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** First paint, largest paint and blocking time of a first visit, the median of `loads`. */
async function pageLoadValues(browser: Browser, url: string, loads: number): Promise<Values> {
  const runs: { firstPaint: number; largestPaint: number; blockingTime: number }[] = [];
  for (let i = 0; i < loads; i++) {
    const context = await browser.newContext(VIEWPORT);
    await context.addInitScript(() => {
      const seen = { largestPaint: 0, longTasks: [] as [number, number][] };
      (window as unknown as { __stats: typeof seen }).__stats = seen;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) seen.largestPaint = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) seen.longTasks.push([e.startTime, e.duration]);
      }).observe({ type: 'longtask', buffered: true });
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(3000); // the page's start-up tasks, after the load event
    runs.push(
      await page.evaluate(() => {
        const seen = (window as unknown as { __stats: { largestPaint: number; longTasks: [number, number][] } }).__stats;
        const firstPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
        const blockingTime = seen.longTasks.filter(([start]) => start >= firstPaint).reduce((sum, [, duration]) => sum + Math.max(0, duration - 50), 0);
        return { firstPaint, largestPaint: seen.largestPaint, blockingTime };
      }),
    );
    await context.close();
  }
  return {
    firstPaint: median(runs.map((r) => r.firstPaint)),
    largestPaint: median(runs.map((r) => r.largestPaint)),
    blockingTime: median(runs.map((r) => r.blockingTime)),
  };
}

const CHORD_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

/** One state of the running app: set up in a fresh page, settled, then measured for `seconds`. */
async function stateValues(browser: Browser, url: string, state: (typeof STATES)[number]['id'], settle: number, seconds: number): Promise<Values> {
  const origin = new URL(url).origin;
  // A visitor already welcomed, so About's welcome does not stand over the page.
  const context = await browser.newContext({ ...VIEWPORT, storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'limpide.welcomed', value: '1' }] }] } });
  const page = await context.newPage();
  await page.goto(url);
  const demo = page.getByRole('button', { name: 'Demo', exact: true });
  await demo.waitFor();
  if (state === 'demo') {
    await demo.click();
    await page.waitForFunction(() => document.querySelector('button[aria-label="Demo"]')?.getAttribute('aria-pressed') === 'true');
  }
  if (state === 'chord') {
    await page.getByRole('radiogroup', { name: 'Voices' }).getByRole('radio', { name: '8', exact: true }).click();
    for (const key of CHORD_KEYS) await page.keyboard.down(key);
  }
  await page.waitForTimeout(settle * 1000);

  const tab = await context.newCDPSession(page);
  const whole = await browser.newBrowserCDPSession();
  await tab.send('Performance.enable');
  const metric = async (name: string) => (await tab.send('Performance.getMetrics')).metrics.find((m) => m.name === name)!.value;
  const cpuTime = async () => {
    const { processInfo } = (await whole.send('SystemInfo.getProcessInfo')) as { processInfo: { cpuTime: number }[] };
    return processInfo.reduce((sum, p) => sum + p.cpuTime, 0);
  };
  const [task0, cpu0, start] = [await metric('TaskDuration'), await cpuTime(), performance.now()];
  // The frames counted inside the page, in one evaluate, so the round trips do not stretch them.
  const frames = await page.evaluate(
    (ms) =>
      new Promise<{ count: number; slowest: number; span: number }>((resolve) => {
        let first = 0;
        let last = 0;
        let count = 0;
        let slowest = 0;
        const frame = (t: number) => {
          if (first === 0) first = t;
          else {
            count++;
            slowest = Math.max(slowest, t - last);
          }
          last = t;
          if (t - first < ms) requestAnimationFrame(frame);
          else resolve({ count, slowest, span: t - first });
        };
        requestAnimationFrame(frame);
      }),
    seconds * 1000,
  );
  const [task1, cpu1, wall] = [await metric('TaskDuration'), await cpuTime(), (performance.now() - start) / 1000];
  await tab.send('HeapProfiler.collectGarbage');
  const heap = await metric('JSHeapUsedSize');
  if (state === 'chord') for (const key of CHORD_KEYS) await page.keyboard.up(key);
  await context.close();
  return {
    [`${state}Fps`]: (frames.count / frames.span) * 1000,
    [`${state}SlowestFrame`]: frames.slowest,
    [`${state}MainThread`]: ((task1 - task0) / wall) * 100,
    [`${state}Cpu`]: ((cpu1 - cpu0) / wall) * 100,
    [`${state}Heap`]: heap,
  };
}

function machine(): string {
  const system = process.platform === 'darwin' ? `macOS ${execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim()}` : `${process.platform}`;
  return `${cpus()[0]?.model ?? 'unknown processor'}, ${cpus().length} cores, ${Math.round(totalmem() / 2 ** 30)} GB, ${system}`;
}

// ——— The rows ———

const readRows = (): Row[] => (existsSync(ROWS) ? JSON.parse(readFileSync(ROWS, 'utf8')) : []);

function writeRows(rows: Row[]) {
  writeFileSync(ROWS, `${JSON.stringify(rows, null, 2)}\n`);
  writeFileSync(PAGE, statisticsPage(rows));
  writeFileSync(README, readmeWithSummary(readFileSync(README, 'utf8'), rows[0]));
  say(`written: docs/statistics.md, docs/statistics.json and the README's summary (${rows.length} rows).`);
}

/** This checkout's row: everything, or with `quick` everything but the suites, in short timings. */
async function measureNow(quick: boolean, work: string): Promise<{ row: Row; failed: boolean }> {
  const date = new Date().toISOString().slice(0, 10);
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version as string;
  say(`measuring ${version}${quick ? ', quickly (no suites, short timings): a check, not a row' : ''}…`);
  const values: Values = { ...(await sizeValues(ROOT)), ...checkValues() };
  let failed = values.typeErrors! > 0 || values.lintErrors! > 0;
  if (!quick) {
    for (const [id, suite] of [
      ['unit', vitestSuite('unit', work)],
      ['engine', vitestSuite('engine', work)],
      ['e2e', playwrightSuite(work)],
    ] as const) {
      Object.assign(values, suiteValues(id, suite));
      if (!suite.counts || suite.counts.failed > 0) {
        failed = true;
        say(`the ${id} tests failed or did not run: run them alone to see why.`);
      }
    }
    Object.assign(values, mergedCoverage(work));
  }
  say('the build…');
  const outDir = join(work, 'site');
  Object.assign(values, buildValues(ROOT, outDir, date));

  const server = await preview({ configFile: false, root: ROOT, logLevel: 'warn', build: { outDir }, preview: { port: PORT, strictPort: true, host: '127.0.0.1' } });
  const browser = await chromium.launch({ channel: 'chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const url = `http://127.0.0.1:${PORT}/`;
    say('the page load…');
    Object.assign(values, await pageLoadValues(browser, url, quick ? 1 : TIMINGS.pageLoads));
    for (const state of STATES) {
      say(`the running app: ${state.title}…`);
      Object.assign(values, await stateValues(browser, url, state.id, quick ? 1 : TIMINGS.settleSeconds, quick ? 2 : TIMINGS.stateSeconds));
    }
    const row: Row = { version, date, machine: machine(), browser: `Chromium ${browser.version()}, headless`, values };
    return { row, failed };
  } finally {
    await browser.close();
    await server.close();
  }
}

/**
 * The exact numbers of each release tag: its code and git history, and its build with its own locked dependencies, in
 * a detached worktree of its own under `work`, removed afterwards. Consecutive tags with the same lock file share one
 * install.
 */
async function measureHistory(tags: string[], work: string): Promise<Row[]> {
  const rows: Row[] = [];
  const installed = join(work, 'node_modules-cache');
  let installedLock = '';
  for (const tag of tags) {
    const dir = join(work, tag);
    const date = git(ROOT, 'log', '-1', '--format=%cs', tag);
    say(`${tag} (${date})…`);
    git(ROOT, 'worktree', 'add', '--detach', '--quiet', dir, tag);
    try {
      const lock = createHash('sha256').update(readFileSync(join(dir, 'package-lock.json'))).digest('hex');
      if (lock === installedLock) renameSync(installed, join(dir, 'node_modules'));
      else {
        rmSync(installed, { recursive: true, force: true });
        // No install scripts: the project's own `prepare` would change git's settings.
        const ci = run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], dir);
        if (ci.status !== 0) throw new Error(`npm ci failed at ${tag}:\n${ci.stderr}`);
      }
      const values = { ...(await sizeValues(dir)), ...buildValues(dir, join(work, `${tag}-site`), date) };
      rows.push({ version: tag.replace(/^v/, ''), date, machine: '', browser: '', values });
      renameSync(join(dir, 'node_modules'), installed);
      installedLock = lock;
    } finally {
      rmSync(join(work, `${tag}-site`), { recursive: true, force: true });
      git(ROOT, 'worktree', 'remove', '--force', dir);
    }
  }
  rmSync(installed, { recursive: true, force: true });
  return rows;
}

async function main() {
  const started = performance.now();
  const work = option('--work') ?? mkdtempSync(join(tmpdir(), 'limpide-stats-'));
  mkdirSync(work, { recursive: true });
  let failed = false;
  try {
    if (args.includes('--history')) {
      const tags = option('--tags')?.split(',') ?? git(ROOT, 'tag', '--list', 'v*', '--sort=version:refname').split('\n').filter(Boolean);
      let rows = readRows();
      for (const row of await measureHistory(tags, work)) rows = withRow(rows, row);
      writeRows(rows);
    } else {
      const quick = args.includes('--quick');
      const measured = await measureNow(quick, join(work, 'now'));
      failed = measured.failed;
      if (quick) console.log(`\n${statisticsPage(withRow(readRows(), measured.row))}`);
      else writeRows(withRow(readRows(), measured.row));
    }
  } finally {
    if (!option('--work')) rmSync(work, { recursive: true, force: true });
  }
  say(`done in ${Math.round((performance.now() - started) / 1000)} s.`);
  if (failed) {
    say('something failed (tests, types or lint): the row says what; fix it before releasing.');
    process.exitCode = 1;
  }
}

await main();
