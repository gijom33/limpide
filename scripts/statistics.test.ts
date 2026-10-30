import { describe, expect, it } from 'vitest';
import {
  fileGroup,
  issueCounts,
  lineCount,
  lintCounts,
  playwrightCounts,
  type Row,
  readmeWithSummary,
  statisticsPage,
  summary,
  testSuite,
  testsWritten,
  typeErrorCount,
  vitestCounts,
  withRow,
} from './statistics';

const row = (version: string, values: Row['values'] = {}): Row => ({
  version,
  date: '2026-11-02',
  machine: 'Apple M2, 8 cores, 16 GB, macOS 26.1',
  browser: 'Chromium 149.0',
  values,
});

describe('reading a suite’s results (issue 84)', () => {
  it('counts Vitest’s tests, passed, failed and skipped', () => {
    const report = JSON.stringify({ numTotalTests: 130, numPassedTests: 126, numFailedTests: 1, numPendingTests: 2, numTodoTests: 1, testResults: [] });
    expect(vitestCounts(report)).toEqual({ tests: 130, passed: 126, failed: 1, skipped: 3 });
  });

  it('counts Playwright’s tests, a flaky one as passed on its retry', () => {
    const report = JSON.stringify({ suites: [], errors: [], stats: { startTime: '', duration: 1000, expected: 300, unexpected: 2, flaky: 1, skipped: 4 } });
    expect(playwrightCounts(report)).toEqual({ tests: 307, passed: 301, failed: 2, skipped: 4 });
  });

  it('counts TypeScript’s errors and Biome’s errors and warnings', () => {
    const tsc = 'src/a.ts(3,1): error TS2322: Type…\nsrc/b.ts(9,4): error TS7006: Parameter…\n  more about it\n';
    expect(typeErrorCount(tsc)).toBe(2);
    expect(typeErrorCount('')).toBe(0);
    expect(lintCounts(JSON.stringify({ summary: { errors: 1, warnings: 3, infos: 0 }, diagnostics: [] }))).toEqual({ errors: 1, warnings: 3 });
  });

  it('counts issues done and open by their Status line, as the issue tracker’s queries do', () => {
    const issue = (status: string) => `# 1: A title\n\n**Blocked by:** none\n\n**Status:** ${status}\n`;
    const issues = ['done (2026-10-30). Built.', 'done, its Status', 'ready-for-agent · bug', 'needs-triage', 'closed (2026-10-27)', 'superseded, by 9', 'ongoing'].map(issue);
    expect(issueCounts([...issues, '# 2: No Status yet\n'])).toEqual({ done: 2, open: 3 });
  });

  it('counts the tests declared in each suite’s files, without running them (the owner, 2026-10-30)', () => {
    expect(testSuite('src/patch/presets.test.ts')).toBe('unit');
    expect(testSuite('scripts/statistics.test.ts')).toBe('unit');
    expect(testSuite('src/engine/synthEngine.browser.test.ts')).toBe('engine');
    expect(testSuite('e2e/demo.spec.ts')).toBe('e2e');
    expect(testSuite('e2e/helpers.ts')).toBeNull();
    expect(testSuite('src/patch/presets.ts')).toBeNull();
    const file = [
      "describe('a thing', () => {",
      "  it('does one thing', () => {});",
      "  it.each([1, 2])('does %i', () => {});",
      "  it.todo('does another');",
      '});',
      "test.describe('a group', () => {",
      "  test.use({ viewport: { width: 375, height: 812 } });",
      "  test.beforeEach(async () => {});",
      "  test('plays', async () => { test.skip(true, 'not here'); test.slow(); });",
      '});',
      "const helper = () => test('not at a line’s start');",
    ].join('\n');
    expect(testsWritten(file)).toBe(4);
  });

  it('counts a file’s lines in the app code, the tests or the docs, blank lines left out', () => {
    expect(fileGroup('src/engine/synthEngine.ts')).toBe('app');
    expect(fileGroup('src/ui/App.tsx')).toBe('app');
    expect(fileGroup('src/styles.css')).toBe('app');
    expect(fileGroup('src/engine/synthEngine.browser.test.ts')).toBe('tests');
    expect(fileGroup('src/test/measure.ts')).toBe('tests');
    expect(fileGroup('e2e/helpers.ts')).toBe('tests');
    expect(fileGroup('scripts/statistics.test.ts')).toBe('tests');
    expect(fileGroup('docs/issues/84-project-statistics.md')).toBe('docs');
    expect(fileGroup('README.md')).toBe('docs');
    expect(fileGroup('scripts/statistics.ts')).toBeNull();
    expect(fileGroup('public/favicon.svg')).toBeNull();
    expect(lineCount('a\n\n  \nb\n')).toBe(2);
  });
});

describe('the rows (issue 84)', () => {
  it('keeps every release’s row, the newest first', () => {
    const rows = withRow(withRow(withRow([], row('1.9.2')), row('1.10.0')), row('1.9.10'));
    expect(rows.map((r) => r.version)).toEqual(['1.10.0', '1.9.10', '1.9.2']);
  });

  it('replaces a version’s numbers when it is measured again', () => {
    const rows = withRow(withRow([row('1.17.0', { commits: 1 }), row('1.16.0')], row('1.17.0', { commits: 2 })), row('1.16.0', { commits: 3 }));
    expect(rows).toEqual([row('1.17.0', { commits: 2 }), row('1.16.0', { commits: 3 })]);
  });

  it('keeps the numbers a new run left out: a history run never blanks a release’s measured ones (the owner, 2026-10-30)', () => {
    const measured = row('1.16.0', { commits: 400, demoFps: 60 });
    const history = { ...row('1.16.0', { commits: 401, demoFps: undefined }), date: '2026-10-30', machine: '', browser: '' };
    expect(withRow([measured], history)).toEqual([{ ...measured, date: '2026-10-30', values: { commits: 401, demoFps: 60 } }]);
    expect(withRow([], history)[0].values).toEqual({ commits: 401 }); // nothing undefined stored
  });
});

describe('the statistics page (issue 84)', () => {
  it('explains every number, and says no release is measured yet', () => {
    const page = statisticsPage([]);
    expect(page).toMatch(/^# Statistics\n/);
    expect(page).toContain('No release has been measured yet');
    expect(page).toContain('A — is a number not measured for that release yet.');
    for (const title of ['## Size', '## Quality', '## Build and load', '## The running app', '### Idle', '### Playing the Demo', '### An 8-Voice chord'])
      expect(page).toContain(`\n${title}\n`);
    expect(page.match(/- \*\*Frames a second:\*\*/g)).toHaveLength(1); // the running app's numbers explained once, for its three states
    expect(page).toContain('- **App code:** the lines with something on them');
    expect(page).toContain('| Version | Frames a second | Slowest frame | Main thread busy | CPU | Memory |');
    expect(page).toMatch(/settles for 2 s, then is measured for 10 s, the same each time/);
  });

  it('shows a second release’s row above the first, with the key numbers’ changes since', () => {
    const first = row('1.16.0', { appLines: 14000, appFiles: 120, unitTests: 600, unitPassed: 600, jsBytes: 300000, jsGzip: 90000, demoFps: 59.8, demoCpu: 30, demoHeap: 20e6, commits: 400 });
    const second = row('1.17.0', { appLines: 14056, appFiles: 121, unitTests: 590, unitPassed: 589, jsBytes: 301000, jsGzip: 90000, demoFps: 60, demoCpu: 27.5, demoHeap: 21.04e6, commits: 420 });
    const page = statisticsPage(withRow(withRow([], first), second));
    expect(page).not.toContain('No release has been measured yet');
    const lines = page.split('\n');
    const size = lines.filter((l) => l.startsWith('| 1.1'));
    expect(size[0]).toBe('| 1.17.0 | 2026-11-02 | Apple M2, 8 cores, 16 GB, macOS 26.1 | Chromium 149.0 |'); // where it was measured
    expect(page).toContain('| 1.17.0 | 14,056 lines, 121 files (+56) | — | — |'); // a change in the key number, not the files
    expect(page).toContain('| 1.16.0 | 14,000 lines, 120 files | — | — |'); // the oldest row has nothing to compare with
    expect(page).toContain('| 1.17.0 | 589 of 590 (−10) |');
    expect(page).toContain('| 1.17.0 | 301.0 kB (90.0 kB gzipped) | — |'); // the gzipped size, unchanged, shows no change
    const third = row('1.18.0', { ...second.values, jsGzip: 90400 });
    expect(statisticsPage(withRow(withRow(withRow([], first), second), third))).toContain('| 1.18.0 | 301.0 kB (90.4 kB gzipped, +0.4 kB) |'); // in the same brackets
    expect(page).toContain('| 1.17.0 | 60.0 (+0.2) | — | — | 27.5% (−2.5 pt) | 21.0 MB (+1.0 MB) |');
    expect(page.indexOf('| 1.17.0 | 14,056')).toBeLessThan(page.indexOf('| 1.16.0 | 14,000'));
  });
});

describe('the README’s summary (issue 84)', () => {
  const readme = '# Limpide\n\nIntro.\n\n<!-- statistics -->\nold words\n<!-- /statistics -->\n\n## License\n';

  it('points to the page before any release is measured', () => {
    expect(readmeWithSummary(readme, undefined)).toBe(
      '# Limpide\n\nIntro.\n\n<!-- statistics -->\nThe project’s size, quality and performance are measured at each release, from the next one, on [the statistics page](docs/statistics.md).\n<!-- /statistics -->\n\n## License\n',
    );
  });

  it('gives the newest row’s headline numbers, leaving out what was not measured', () => {
    const values = { appLines: 14056, unitTests: 590, unitPassed: 590, engineTests: 80, enginePassed: 80, coverageLines: 61.24, jsGzip: 90000, largestPaint: 312.4, demoFps: 59.9, demoCpu: 27.46 };
    expect(summary(row('1.17.0', values))).toBe(
      'At 1.17.0 (2026-11-02): 14,056 lines of app code, 670 tests, all passing, 61.2% of the app code’s lines run by the unit and engine tests, 90.0 kB of JavaScript gzipped, the page drawn in 312 ms, the Demo at 60 frames a second for 27.5% of a processor core. Every number, release by release, is on [the statistics page](docs/statistics.md).',
    );
    expect(summary(row('1.17.0', { appLines: 10, unitTests: 5, unitPassed: 4 }))).toMatch(/: 10 lines of app code, 4 of 5 tests passing\. Every/);
    expect(summary(row('1.16.0', { appLines: 10, testsWritten: 7, jsGzip: 1000 }))).toMatch(/: 10 lines of app code, 7 tests written, 1\.0 kB of JavaScript gzipped\. Every/); // a history row
    expect(readmeWithSummary(readme, row('1.17.0', values))).toMatch(/<!-- statistics -->\nAt 1\.17\.0 .*\n<!-- \/statistics -->\n\n## License\n$/);
  });

  it('needs its two markers in the README', () => {
    expect(() => readmeWithSummary('# Limpide\n', undefined)).toThrow(/<!-- statistics -->/);
  });
});
