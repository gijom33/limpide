// The project's statistics (issue 84): what a release's row holds, how each number is read from its tool's output, and
// the page and the README's summary written from the rows. Measuring them is `measureStatistics.ts`, run by
// `npm run stats` before each release's commit.

/** How long each state of the running app is measured, after it has settled, and how many page loads are timed. */
export const TIMINGS = { stateSeconds: 10, settleSeconds: 2, pageLoads: 3 };

/** The running app's three states (the owner, 2026-10-30): the page left alone, the Demo playing, an 8-Voice chord held. */
export const STATES = [
  { id: 'idle', title: 'idle', what: 'the page open on Init, nothing playing' },
  { id: 'demo', title: 'playing the Demo', what: 'the Demo playing from its start' },
  { id: 'chord', title: 'an 8-Voice chord', what: 'Init with 8 Voices, eight keys held (A S D F G H J K, C4 to C5)' },
] as const;

/**
 * One release's numbers. A number left out was not measured: a release's history row holds only the exact ones, read
 * from its tag. The machine and browser are empty when nothing that depends on them was measured.
 */
export interface Row {
  version: string;
  /** YYYY-MM-DD */
  date: string;
  machine: string;
  browser: string;
  values: Record<string, number | undefined>;
}

/** A test suite's results. */
export interface SuiteCounts {
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
}

/** The counts in Vitest's JSON report (`--reporter=json`). */
export function vitestCounts(report: string): SuiteCounts {
  const r = JSON.parse(report);
  return {
    tests: r.numTotalTests,
    passed: r.numPassedTests,
    failed: r.numFailedTests,
    skipped: (r.numPendingTests ?? 0) + (r.numTodoTests ?? 0),
  };
}

/** The counts in Playwright's JSON report: a test is counted once per browser it runs in; a flaky one passed on a retry. */
export function playwrightCounts(report: string): SuiteCounts {
  const { expected, unexpected, flaky, skipped } = JSON.parse(report).stats;
  return { tests: expected + unexpected + flaky + skipped, passed: expected + flaky, failed: unexpected, skipped };
}

/** The type errors `tsc --pretty false` printed. */
export const typeErrorCount = (output: string) => output.match(/error TS\d+:/g)?.length ?? 0;

/** The errors and warnings in Biome's JSON report (`biome check --reporter=json`). */
export function lintCounts(report: string): { errors: number; warnings: number } {
  const { errors, warnings } = JSON.parse(report).summary;
  return { errors, warnings };
}

/**
 * Done and open issues, from each issue file's Status line: done starts `done`; open is anything not done, closed,
 * superseded or ongoing (the issue tracker's query, `docs/agents/issue-tracker.md`).
 */
export function issueCounts(issues: string[]): { done: number; open: number } {
  let done = 0;
  let open = 0;
  for (const text of issues) {
    const status = text.match(/^\*\*Status:\*\* (.*)$/m)?.[1] ?? '';
    if (status.startsWith('done')) done++;
    else if (!/^(closed|superseded|ongoing)/.test(status)) open++;
  }
  return { done, open };
}

/** Which group a tracked file's lines count in: the app's code, its tests, the docs, or none (config, images…). */
export function fileGroup(path: string): 'app' | 'tests' | 'docs' | null {
  if (path.endsWith('.md')) return 'docs';
  if (/^(e2e|src\/test)\//.test(path) || /\.test\.tsx?$/.test(path)) return 'tests';
  if (/^src\/.*\.(tsx?|css)$/.test(path)) return 'app';
  return null;
}

/** Which suite a test file belongs to, or null for a file that is not one. */
export function testSuite(path: string): 'unit' | 'engine' | 'e2e' | null {
  if (/^e2e\/.*\.spec\.ts$/.test(path)) return 'e2e';
  if (/\.browser\.test\.ts$/.test(path)) return 'engine';
  if (/\.test\.tsx?$/.test(path)) return 'unit';
  return null;
}

/**
 * The tests a test file declares: each `it(…)` or `test(…)` at the start of a line, `.each`, `.only`, `.todo` and
 * `.fails` included. A test written once in a loop counts once; Playwright's `test.skip(…)` is a skip inside a test, not
 * one, and `test.describe`, `test.use` and the like are left out.
 */
export const testsWritten = (text: string) => text.match(/^\s*(?:it|test)(?:\.(?:each|only|todo|fails|concurrent))?\s*\(/gm)?.length ?? 0;

/** The lines of a file with something on them. */
export const lineCount = (text: string) => text.split('\n').filter((line) => line.trim() !== '').length;

/** Newest version first: 1.10.0 before 1.9.2. */
function byVersionDescending(a: Row, b: Row) {
  const pa = a.version.split('.').map(Number);
  const pb = b.version.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
  return 0;
}

/**
 * The rows with `row` added, the newest first. A version measured again takes the new numbers, and keeps those the new
 * run left out: a history run, which reads only the exact numbers, never blanks a release's measured ones.
 */
export function withRow(rows: Row[], row: Row): Row[] {
  const old = rows.find((r) => r.version === row.version);
  const measured = Object.fromEntries(Object.entries(row.values).filter(([, n]) => n !== undefined));
  const merged = old
    ? { ...row, machine: row.machine || old.machine, browser: row.browser || old.browser, values: { ...old.values, ...measured } }
    : { ...row, values: measured };
  return [...rows.filter((r) => r !== old), merged].sort(byVersionDescending);
}

// How the page writes each kind of number.
const count = (n: number) => Math.round(n).toLocaleString('en-US');
const kB = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;
const MB = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
const ms = (n: number) => `${Math.round(n)} ms`;
const seconds = (n: number) => `${Math.round(n)} s`;
const percent = (n: number) => `${n.toFixed(1)}%`;
const fps = (n: number) => n.toFixed(1);

/** A key number's change: which value, and how its size is written (in the number's own unit, or points for a share). */
interface Change {
  id: string;
  write: (magnitude: number) => string;
}
const changeIn = (id: string, write: (n: number) => string): Change => ({ id, write });
const points = (n: number) => `${n.toFixed(1)} pt`;

interface Column {
  header: string;
  /** One line: what it measures and how. */
  explain: string;
  /** The cell, from the row's values; null when one of them was not measured. */
  cell: (v: Row['values']) => string | null;
  /** The key numbers show their change since the row below. */
  change?: Change;
}

const has = (v: Row['values'], ...ids: string[]) => ids.every((id) => v[id] !== undefined);
const linesAndFiles = (group: string) => (v: Row['values']) =>
  has(v, `${group}Lines`, `${group}Files`) ? `${count(v[`${group}Lines`]!)} lines, ${count(v[`${group}Files`]!)} files` : null;
const one = (id: string, write: (n: number) => string) => (v: Row['values']) => (has(v, id) ? write(v[id]!) : null);
const suite = (id: string) => (v: Row['values']) => (has(v, `${id}Passed`, `${id}Tests`) ? `${count(v[`${id}Passed`]!)} of ${count(v[`${id}Tests`]!)}` : null);
const rawAndGzip = (id: string) => (v: Row['values']) => (has(v, `${id}Bytes`, `${id}Gzip`) ? `${kB(v[`${id}Bytes`]!)} (${kB(v[`${id}Gzip`]!)} gzipped)` : null);

interface Table {
  title: string;
  intro?: string;
  columns: Column[];
}

const capital = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

const runningApp = (state: (typeof STATES)[number]): Table => ({
  title: capital(state.title),
  intro: `${capital(state.what)}.`,
  columns: [
    {
      header: 'Frames a second',
      explain: 'how many frames Chromium drew each second, counted by `requestAnimationFrame` (60 at most, headless)',
      cell: one(`${state.id}Fps`, fps),
      change: changeIn(`${state.id}Fps`, fps),
    },
    {
      header: 'Slowest frame',
      explain: 'the longest gap between two frames: a stutter shows here even when the average is smooth',
      cell: one(`${state.id}SlowestFrame`, ms),
    },
    {
      header: 'Main thread busy',
      explain: 'the share of the time the page’s main thread spent running tasks (DevTools’ `TaskDuration`): what is left is room to spare',
      cell: one(`${state.id}MainThread`, percent),
      change: changeIn(`${state.id}MainThread`, points),
    },
    {
      header: 'CPU',
      explain: 'the processor time all of Chromium’s processes used, the audio’s included, as a share of one core (above 100% means more than one)',
      cell: one(`${state.id}Cpu`, percent),
      change: changeIn(`${state.id}Cpu`, points),
    },
    {
      header: 'Memory',
      explain: 'the JavaScript heap in use at the end, after a garbage collection (DevTools’ `JSHeapUsedSize`)',
      cell: one(`${state.id}Heap`, MB),
      change: changeIn(`${state.id}Heap`, MB),
    },
  ],
});

const TABLES: Table[] = [
  {
    title: 'Size',
    intro: 'Counted in the files git tracks.',
    columns: [
      {
        header: 'App code',
        explain: 'the lines with something on them, and the files, of the code the app runs: `src/`’s TypeScript and CSS, its tests apart',
        cell: linesAndFiles('app'),
        change: changeIn('appLines', count),
      },
      {
        header: 'Tests',
        explain: 'the same for the tests: the unit and engine tests in `src/`, their helpers, the end-to-end tests in `e2e/` and the scripts’ tests',
        cell: linesAndFiles('tests'),
        change: changeIn('testsLines', count),
      },
      {
        header: 'Tests written',
        explain: 'the tests declared in each suite’s files, `it(…)` and `test(…)`, counted in the code rather than run: a test written once in a loop counts once, so the suites run more',
        cell: (v) =>
          has(v, 'unitWritten', 'engineWritten', 'e2eWritten')
            ? `${count(v.unitWritten!)} unit, ${count(v.engineWritten!)} engine, ${count(v.e2eWritten!)} end-to-end`
            : null,
        change: changeIn('testsWritten', count),
      },
      {
        header: 'Docs',
        explain: 'the same for every Markdown file: the docs, the issues, the reviews, the README and the project’s rules',
        cell: linesAndFiles('docs'),
      },
      { header: 'Presets', explain: 'the factory Presets, Init included', cell: one('presets', count), change: changeIn('presets', count) },
      { header: 'Tutorials', explain: 'the Tutorials (0 before there were any)', cell: one('tutorials', count) },
      {
        header: 'Issues',
        explain: 'the issues in `docs/issues` done, and open (not done, closed, superseded or ongoing)',
        cell: (v) => (has(v, 'issuesDone', 'issuesOpen') ? `${count(v.issuesDone!)} done, ${count(v.issuesOpen!)} open` : null),
      },
      { header: 'Commits', explain: 'the commits in the history up to the one measured', cell: one('commits', count) },
    ],
  },
  {
    title: 'Quality',
    columns: [
      {
        header: 'Unit tests',
        explain: 'the unit tests that passed, of all of them (Vitest’s unit project, in Node)',
        cell: suite('unit'),
        change: changeIn('unitTests', count),
      },
      {
        header: 'Engine tests',
        explain: 'the same for the engine tests, which render real audio in headless Chromium (Vitest’s engine project)',
        cell: suite('engine'),
        change: changeIn('engineTests', count),
      },
      {
        header: 'End-to-end tests',
        explain: 'the same for Playwright’s tests of the built site, each counted once in Chromium and once in WebKit',
        cell: suite('e2e'),
        change: changeIn('e2eTests', count),
      },
      {
        header: 'Coverage',
        explain: 'the share of the app code’s lines, and of its branches, that the unit and engine tests run (Vitest’s V8 coverage; the end-to-end tests are not counted)',
        cell: (v) => (has(v, 'coverageLines', 'coverageBranches') ? `${percent(v.coverageLines!)} of lines, ${percent(v.coverageBranches!)} of branches` : null),
        change: changeIn('coverageLines', points),
      },
      {
        header: 'Lint',
        explain: 'Biome’s errors and warnings (`npm run lint`)',
        cell: (v) => (has(v, 'lintErrors', 'lintWarnings') ? `${count(v.lintErrors!)} errors, ${count(v.lintWarnings!)} warnings` : null),
      },
      { header: 'Type errors', explain: 'the errors TypeScript finds (`npx tsc`)', cell: one('typeErrors', count) },
    ],
  },
  {
    title: 'Build and load',
    columns: [
      {
        header: 'JavaScript',
        explain: 'the size of the built page’s JavaScript, as built and gzipped (what a visitor downloads)',
        cell: rawAndGzip('js'),
        change: changeIn('jsGzip', kB),
      },
      { header: 'CSS', explain: 'the same for its CSS', cell: rawAndGzip('css'), change: changeIn('cssGzip', kB) },
      {
        header: 'Unit run',
        explain: 'how long the unit tests took, from the command to its end, coverage on (a little longer than a plain run)',
        cell: one('unitSeconds', seconds),
      },
      { header: 'Engine run', explain: 'the same for the engine tests', cell: one('engineSeconds', seconds) },
      {
        header: 'End-to-end run',
        explain: 'the same for the end-to-end tests, the site’s build included',
        cell: one('e2eSeconds', seconds),
        change: changeIn('e2eSeconds', seconds),
      },
      {
        header: 'First paint',
        explain: 'when the first text or picture was drawn, after the page was asked for (First Contentful Paint)',
        cell: one('firstPaint', ms),
        change: changeIn('firstPaint', ms),
      },
      {
        header: 'Largest paint',
        explain: 'when the largest text or picture was drawn (Largest Contentful Paint)',
        cell: one('largestPaint', ms),
        change: changeIn('largestPaint', ms),
      },
      {
        header: 'Blocking time',
        explain: 'Total Blocking Time: of each task longer than 50 ms after the first paint, what went over 50 ms, added up (the page could not answer a click meanwhile)',
        cell: one('blockingTime', ms),
        change: changeIn('blockingTime', ms),
      },
    ],
  },
];

const MACHINE = [
  ['Date', 'the day it was measured, or for a history row the day of the release'],
  ['Machine', 'the computer: its processor, cores, memory and system (— for a history row, whose numbers do not depend on it)'],
  ['Browser', 'the browser the page loads and the running app were measured in'],
];

/** A cell with, for a key number, its change since the row below: "1,234 (+56)", or "1.0 kB (0.4 kB gzipped, +0.1 kB)". */
function cellText(column: Column, row: Row, previous: Row | undefined): string {
  const text = column.cell(row.values);
  if (text === null) return '—';
  const id = column.change?.id;
  const now = id === undefined ? undefined : row.values[id];
  const before = id === undefined ? undefined : previous?.values[id];
  if (now === undefined || before === undefined) return text;
  const { write } = column.change!;
  const written = write(Math.abs(now - before));
  if (written === write(0)) return text;
  const change = `${now > before ? '+' : '−'}${written}`;
  return text.endsWith(')') ? `${text.slice(0, -1)}, ${change})` : `${text} (${change})`;
}

const tableLine = (cells: string[]) => `| ${cells.join(' | ')} |`;

/** A table and, unless `explained` elsewhere, the line that explains each of its numbers. */
function tableMarkdown(table: Table, rows: Row[], heading = '##', explained = false): string[] {
  return [
    `${heading} ${table.title}`,
    '',
    ...(table.intro ? [table.intro, ''] : []),
    tableLine(['Version', ...table.columns.map((c) => c.header)]),
    tableLine(['---', ...table.columns.map(() => '---')]),
    ...rows.map((row, i) => tableLine([row.version, ...table.columns.map((c) => cellText(c, row, rows[i + 1]))])),
    '',
    ...(explained ? [] : [...table.columns.map((c) => `- **${c.header}:** ${c.explain}.`), '']),
  ];
}

/** The statistics page: one row per release in each table, the newest first, each number explained under its table. */
export function statisticsPage(rows: Row[]): string {
  const { stateSeconds, settleSeconds, pageLoads } = TIMINGS;
  return [
    '# Statistics',
    '',
    'The project’s size, quality and performance, one row per release, the newest first ([issue 84](issues/84-project-statistics.md)). `npm run stats` measures them and writes this page before each release’s commit ([releasing.md](releasing.md)); run again for the same version, it replaces that version’s numbers. The key numbers show in brackets their change since the release below.',
    '',
    'A — is a number not measured for that release yet. The releases before the command existed hold only the exact numbers, the ones that do not depend on the machine: `npm run stats -- --history` reads them from each release’s tag, its code, its git history and its build with its own locked dependencies, on the release’s date, and gives the same numbers every time. The test runs, the coverage, the page load and the running app can be added to those rows later.',
    '',
    ...(rows.length === 0 ? ['No release has been measured yet: the first row is measured at the next release, on a quiet machine.', ''] : []),
    '## Where it was measured',
    '',
    `The page loads and the running app are measured in Chromium through Playwright, headless, in a 1440 × 900 window at twice the pixels (a Retina screen), on the built site served from this computer. A page load is the median of ${pageLoads}, each a first visit with an empty cache. Each state of the running app starts in a fresh page, settles for ${settleSeconds} s, then is measured for ${stateSeconds} s, the same each time. Other work on the machine skews the timings: measure on a quiet one.`,
    '',
    tableLine(['Version', ...MACHINE.map(([header]) => header)]),
    tableLine(['---', ...MACHINE.map(() => '---')]),
    ...rows.map((row) => tableLine([row.version, row.date, row.machine || '—', row.browser || '—'])),
    '',
    ...MACHINE.map(([header, explain]) => `- **${header}:** ${explain}.`),
    '',
    ...TABLES.flatMap((table) => tableMarkdown(table, rows)),
    '## The running app',
    '',
    'Three states, each with the same five numbers:',
    '',
    ...runningApp(STATES[0]).columns.map((c) => `- **${c.header}:** ${c.explain}.`),
    '',
    ...STATES.flatMap((state) => tableMarkdown(runningApp(state), rows, '###', true)),
  ]
    .join('\n')
    .replace(/\n+$/, '\n');
}

const SUMMARY_START = '<!-- statistics -->';
const SUMMARY_END = '<!-- /statistics -->';

/** The README's few headline numbers, from the newest row. */
export function summary(row: Row | undefined): string {
  const link = '[the statistics page](docs/statistics.md)';
  if (!row) return `The project’s size, quality and performance are measured at each release, from the next one, on ${link}.`;
  const v = row.values;
  const tests = ['unit', 'engine', 'e2e'].filter((id) => has(v, `${id}Tests`, `${id}Passed`));
  const total = tests.reduce((sum, id) => sum + v[`${id}Tests`]!, 0);
  const passed = tests.reduce((sum, id) => sum + v[`${id}Passed`]!, 0);
  const parts = [
    has(v, 'appLines') && `${count(v.appLines!)} lines of app code`,
    tests.length > 0 && (passed === total ? `${count(total)} tests, all passing` : `${count(passed)} of ${count(total)} tests passing`),
    tests.length === 0 && has(v, 'testsWritten') && `${count(v.testsWritten!)} tests written`,
    has(v, 'coverageLines') && `${percent(v.coverageLines!)} of the app code’s lines run by the unit and engine tests`,
    has(v, 'jsGzip') && `${kB(v.jsGzip!)} of JavaScript gzipped`,
    has(v, 'largestPaint') && `the page drawn in ${ms(v.largestPaint!)}`,
    has(v, 'demoFps', 'demoCpu') && `the Demo at ${Math.round(v.demoFps!)} frames a second for ${percent(v.demoCpu!)} of a processor core`,
  ].filter((part): part is string => typeof part === 'string');
  return `At ${row.version} (${row.date}): ${parts.join(', ')}. Every number, release by release, is on ${link}.`;
}

/** The README with its summary, between its two markers, rewritten from the newest row. */
export function readmeWithSummary(readme: string, newest: Row | undefined): string {
  const start = readme.indexOf(SUMMARY_START);
  const end = readme.indexOf(SUMMARY_END);
  if (start < 0 || end < start) throw new Error(`The README has no ${SUMMARY_START} … ${SUMMARY_END} for the statistics' summary.`);
  return `${readme.slice(0, start + SUMMARY_START.length)}\n${summary(newest)}\n${readme.slice(end)}`;
}
