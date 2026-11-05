// `npm run perf` (issue 221): measures the running app the way review 18 did (docs/reviews/2026-11-02), so a change to
// what a frame costs is measured the same way each time. It builds the site, serves it, and opens each state in a fresh
// headless Chromium page at 1440 × 900 and twice the pixels: 3 s of start-up, 2 s to settle under the CPU throttling,
// then 10 s measured. It prints one table, the mean of the runs; nothing is written.
//
//   npm run perf                                   idle, the Demo and an 8-Voice chord, at 1×, 1.25× and 4×, with Bead
//                                                  out and with it off, two runs each (about 10 minutes)
//   npm run perf -- --states idle --throttle 1,4   some of them (--bead on or off for one of the two; --runs N)
//   npm run perf -- --quick                        a check of the command itself: one run, 1 s settled, 2 s measured
//
// Other work on the machine skews the timings, the style recalculations a frame less so: measure on a quiet one, and
// note its load (`uptime`). It serves the site on port 5399, never the end-to-end tests' 5199.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { loadavg, tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, chromium } from 'playwright';
import { preview } from 'vite';

const ROOT = process.cwd();
const PORT = 5399;
const VIEWPORT = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const STATES = {
  idle: 'idle: the page open on Init, never clicked, so the sound has not started',
  demo: 'the Demo: playing from its start',
  chord: 'an 8-Voice chord: Init with 8 Voices, eight keys held (A S D F G H J K)',
} as const;
type State = keyof typeof STATES;
const CHORD_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const quick = args.includes('--quick');
const states = (option('--states')?.split(',') ?? Object.keys(STATES)) as State[];
const throttles = (option('--throttle') ?? '1,1.25,4').split(',').map(Number);
const beads = option('--bead') ? [option('--bead') === 'on'] : [true, false];
const runs = Number(option('--runs') ?? (quick ? 1 : 2));
const [startUp, settle, seconds] = quick ? [3, 1, 2] : [3, 2, 10];
for (const s of states) if (!(s in STATES)) throw new Error(`No state "${s}": ${Object.keys(STATES).join(', ')}.`);
if (throttles.some((t) => !(t >= 1))) throw new Error('--throttle takes rates of 1 or more, such as 1,1.25,4.');

const say = (line: string) => console.log(`perf: ${line}`);

interface Measure {
  /** Frames per second, from requestAnimationFrame. */
  fps: number;
  /** The longest gap between two frames, ms. */
  slowest: number;
  /** The main thread's busy share, DevTools' `TaskDuration` over the time measured, %. */
  busy: number;
  /** The share of the main thread spent in requestAnimationFrame callbacks: the render loop and Bead, mostly, %. */
  frameWork: number;
  /** Style recalculations and layouts a frame, from DevTools' `RecalcStyleCount` and `LayoutCount`. */
  styles: number;
  layouts: number;
}

/** One state, in a fresh page, with Bead out or off, under `throttle`× CPU throttling. */
async function measure(browser: Browser, url: string, state: State, bead: boolean, throttle: number): Promise<Measure> {
  const origin = new URL(url).origin;
  const localStorage = [
    { name: 'limpide.welcomed', value: '1' },
    { name: 'limpide.bead', value: bead ? 'on' : 'off' },
  ];
  const context = await browser.newContext({ ...VIEWPORT, storageState: { cookies: [], origins: [{ origin, localStorage }] } });
  // The time spent in requestAnimationFrame's callbacks, summed in the page.
  await context.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    const timed = { ms: 0 };
    (window as unknown as { __frameWork: typeof timed }).__frameWork = timed;
    window.requestAnimationFrame = (callback) =>
      raf((t) => {
        const start = performance.now();
        try {
          callback(t);
        } finally {
          timed.ms += performance.now() - start;
        }
      });
  });
  const page = await context.newPage();
  await page.goto(url);
  const demo = page.getByRole('button', { name: 'Demo', exact: true });
  await demo.waitFor();
  await page.waitForTimeout(startUp * 1000);
  // Bead comes out by itself a few seconds in (issue 150).
  if (bead) await page.locator('.mascot').waitFor({ state: 'visible', timeout: 20_000 });
  if (state === 'demo') {
    await demo.click();
    await page.waitForFunction(() => document.querySelector('button[aria-label="Demo"]')?.getAttribute('aria-pressed') === 'true');
  }
  if (state === 'chord') {
    await page.getByRole('radiogroup', { name: 'Voices' }).getByRole('radio', { name: '8', exact: true }).click();
    for (const key of CHORD_KEYS) await page.keyboard.down(key);
  }
  const tab = await context.newCDPSession(page);
  await tab.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await tab.send('Performance.enable');
  await page.waitForTimeout(settle * 1000);

  const metrics = async () => {
    const all = (await tab.send('Performance.getMetrics')).metrics;
    const of = (name: string) => all.find((m) => m.name === name)!.value;
    return { task: of('TaskDuration'), styles: of('RecalcStyleCount'), layouts: of('LayoutCount') };
  };
  const frameWork = () => page.evaluate(() => (window as unknown as { __frameWork: { ms: number } }).__frameWork.ms);
  const [before, work0, start] = [await metrics(), await frameWork(), performance.now()];
  // The frames counted inside the page, in one evaluate, so the round trips do not stretch them.
  const frames = await page.evaluate(
    (ms) =>
      new Promise<{ count: number; slowest: number; span: number }>((resolve) => {
        let [first, last, count, slowest] = [0, 0, 0, 0];
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
  const [after, work1, wall] = [await metrics(), await frameWork(), performance.now() - start];
  if (state === 'chord') for (const key of CHORD_KEYS) await page.keyboard.up(key);
  await context.close();
  return {
    fps: (frames.count / frames.span) * 1000,
    slowest: frames.slowest,
    busy: ((after.task - before.task) * 1000 * 100) / wall,
    frameWork: ((work1 - work0) * 100) / wall,
    styles: (after.styles - before.styles) / frames.count,
    layouts: (after.layouts - before.layouts) / frames.count,
  };
}

const mean = (ms: Measure[]): Measure => {
  const of = (key: keyof Measure) => ms.reduce((sum, m) => sum + m[key], 0) / ms.length;
  return { fps: of('fps'), slowest: of('slowest'), busy: of('busy'), frameWork: of('frameWork'), styles: of('styles'), layouts: of('layouts') };
};

async function main() {
  const work = mkdtempSync(join(tmpdir(), 'limpide-perf-'));
  const outDir = join(work, 'site');
  say('the build…');
  // Built as the end-to-end tests build it: without the visit counter, so measuring counts no visits.
  const build = spawnSync('npx', ['vite', 'build', '--mode', 'e2e', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, encoding: 'utf8' });
  if (build.status !== 0) throw new Error(`The build failed:\n${build.stderr}`);
  const server = await preview({ configFile: false, root: ROOT, logLevel: 'warn', build: { outDir }, preview: { port: PORT, strictPort: true, host: '127.0.0.1' } });
  const browser = await chromium.launch({ channel: 'chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const rows: string[] = [];
  try {
    const url = `http://127.0.0.1:${PORT}/`;
    for (const state of states)
      for (const bead of beads)
        for (const throttle of throttles) {
          const measured: Measure[] = [];
          for (let i = 0; i < runs; i++) {
            say(`${state}, Bead ${bead ? 'out' : 'off'}, ${throttle}×, run ${i + 1} of ${runs} (load ${loadavg()[0].toFixed(1)})…`);
            measured.push(await measure(browser, url, state, bead, throttle));
          }
          const m = mean(measured);
          rows.push(
            `| ${state} | ${bead ? 'out' : 'off'} | ${throttle}× | ${m.fps.toFixed(1)} | ${m.slowest.toFixed(0)} | ${m.busy.toFixed(1)} % | ${m.frameWork.toFixed(1)} % | ${m.styles.toFixed(2)} | ${m.layouts.toFixed(2)} |`,
          );
        }
    console.log(`\nChromium ${browser.version()}, headless, the mean of ${runs} run${runs > 1 ? 's' : ''}; ${seconds} s measured after ${settle} s settled.`);
    for (const state of states) console.log(`- ${STATES[state]}`);
    console.log('\n| State | Bead | CPU | fps | Slowest frame, ms | Main thread busy | In frame callbacks | Style recalcs a frame | Layouts a frame |');
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const row of rows) console.log(row);
  } finally {
    await browser.close();
    await server.close();
    rmSync(work, { recursive: true, force: true });
  }
}

await main();
