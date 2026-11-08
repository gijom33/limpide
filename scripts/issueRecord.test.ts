import { describe, expect, it } from 'vitest';
import { doneBoxProblems, issueIndex, openCalls, recordProblems } from './issueRecord';

const issue = (file: string, title: string, status: string, body = '') => ({
  file: `docs/issues/${file}`,
  text: `# ${title}\n\n**What to build:** something.\n\n**Status:** ${status}\n${body}`,
});

describe('the index of the issues (issue 261)', () => {
  it('lists the open issues, then the finished ones, each by number with its title linked and its Status’s first words', () => {
    const index = issueIndex([
      issue('9-a-done-one.md', '9: A done one', 'done (2026-10-28). Built and tried; "All good."'),
      issue('70-short-title.md', '70: Short title', 'ready-for-agent · enhancement. In v1 as polish ([131](./131-v1.md)), decided by the owner.'),
      issue('100-replaced.md', '100: Replaced', 'superseded (2026-11-02) by [197](./197-bead-rides-everywhere.md): its rides went there.'),
      issue('25-releases.md', '25: Releases', 'ongoing; the release log.'),
    ]);
    expect(index).toContain(
      [
        '## Open (1)',
        '',
        '| # | Issue | Status |',
        '| --: | --- | --- |',
        '| 70 | [Short title](issues/70-short-title.md) | ready-for-agent · enhancement |',
        '',
        '## Done, closed, superseded or ongoing (3)',
        '',
        '| # | Issue | Status |',
        '| --: | --- | --- |',
        '| 9 | [A done one](issues/9-a-done-one.md) | done (2026-10-28) |',
        '| 25 | [Releases](issues/25-releases.md) | ongoing |',
        '| 100 | [Replaced](issues/100-replaced.md) | superseded (2026-11-02) by 197 |',
        '',
      ].join('\n'),
    );
    expect(index).toMatch(/^# The issues\n/);
    expect(index).toContain('npm run issues');
  });
});

describe('the calls open to the owner (issue 261)', () => {
  it('lists every line still open to the owner, each linked to where it was made', () => {
    const page = openCalls([
      issue('248-a-fade.md', '248: A fade', 'ready-for-human · enhancement. Built (2026-11-06); Claude’s call, open to the owner: built at night.', [
        '',
        '## Decisions',
        '1. **The fade** is 10 ms (decided by the owner).',
        "2. **Linear**, not equal-power ([ADR-0021](../adr/0021-x.md), Claude's call, open to the owner).",
        "3. **The margin** stays 1.1 (Claude's call, let stand by the owner in 1.26.0).",
      ].join('\n')),
      { file: 'docs/inbox.md', text: "# Inbox\n\n## Dropped\n\n- 2026-11-05, rain: dropped, Claude's call, open to the owner.\n- 2026-11-04, snow: dropped (decided by the owner).\n" },
      { file: 'docs/adr/0021-x.md', text: "# 21. A fader\n\n**Status:** accepted · **Date:** 2026-11-03 · **Decided by:** Claude's call, open to the owner ([issue 227](../issues/227-x.md))\n" },
    ]);
    expect(page).toContain(
      [
        '- [Issue 248, Status](issues/248-a-fade.md): ready-for-human · enhancement. Built (2026-11-06); Claude’s call, open to the owner: built at night.',
        "- [Issue 248, decision 2](issues/248-a-fade.md): Linear, not equal-power (ADR-0021, Claude's call, open to the owner).",
        "- [ADR-0021, Status](adr/0021-x.md): accepted · Date: 2026-11-03 · Decided by: Claude's call, open to the owner (issue 227)",
        "- [Inbox, 2026-11-05](inbox.md): 2026-11-05, rain: dropped, Claude's call, open to the owner.",
      ].join('\n'),
    );
    expect(page).toContain('4 calls open to the owner');
    expect(page).not.toMatch(/margin|fade is 10 ms|snow/);
  });

  it('takes a list under "Claude’s calls, open to the owner:" call by call', () => {
    const page = openCalls([
      issue('256-beats.md', '256: Beats', 'ready-for-human · bug.', [
        '',
        '## How it was built',
        '',
        "- **Claude's calls, open to the owner:**",
        '  1. The beat is counted at A3.',
        '     A line more about it.',
        '  2. Ten intervals, not twelve.',
        '- **Try:** the fifths.',
        '',
        "**Calls open to the owner** (all Claude's call):",
        '',
        '- The words.',
      ].join('\n')),
    ]);
    expect(page).toContain(
      [
        '- [Issue 256, call 1](issues/256-beats.md): The beat is counted at A3.',
        '- [Issue 256, call 2](issues/256-beats.md): Ten intervals, not twelve.',
        '- [Issue 256](issues/256-beats.md): The words.',
      ].join('\n'),
    );
    expect(page).toContain('3 calls open to the owner');
  });

  it('leaves out a line that speaks of the calls rather than making one', () => {
    const page = openCalls([
      issue('261-record.md', '261: Record', 'ready-for-agent · enhancement.', '\n**Summary:** One place listing the calls still open to the owner, and every call still open to the owner; 225 lines read "open to the owner".'),
    ]);
    expect(page).toContain('0 calls open to the owner');
    expect(page).not.toContain('Issue 261');
  });

  it('leaves out the rule quoted, and an ADR’s body, frozen once accepted: its calls are in its Status line', () => {
    const page = openCalls([
      issue('56-rules.md', '56: Rules', 'done (2026-10-27).', '\n5. **Claude\'s calls marked** "Claude\'s call, open to the owner"; a grilling\'s answers in its issue.'),
      { file: 'docs/adr/0010-x.md', text: '# 10. Records\n\n**Status:** accepted · **Decided by:** the owner\n\n3. A call Claude makes alone says Claude\'s call, open to the owner.\n' },
    ]);
    expect(page).toContain('0 calls open to the owner');
  });
});

describe('a done issue’s boxes (issue 261)', () => {
  const boxes = ['', '**Acceptance criteria:**', '- [x] The fade is 10 ms', '- [ ] ~~The cost measured by `npm run stats`~~ (not checked at the time)'];

  it('are each ticked, or struck through with the reason', () => {
    expect(doneBoxProblems([issue('248-a-fade.md', '248: A fade', 'done (2026-11-07).', boxes.join('\n'))])).toEqual([]);
  });

  it('may not leave one unticked, nor struck without a reason', () => {
    const body = [...boxes, '- [ ] Every test passes in Linux’s fonts too', '  - [ ] ~~A nested one~~'].join('\n');
    expect(doneBoxProblems([issue('248-a-fade.md', '248: A fade', 'done (2026-11-07).', body)])).toEqual([
      'docs/issues/248-a-fade.md is done with a box unticked; tick it or strike it with the reason (`- [ ] ~~…~~ (not checked at the time)`): "- [ ] Every test passes in Linux’s fonts too".',
      'docs/issues/248-a-fade.md is done with a box unticked; tick it or strike it with the reason (`- [ ] ~~…~~ (not checked at the time)`): "- [ ] ~~A nested one~~".',
    ]);
  });

  it('may stay unticked while the issue is open', () => {
    expect(doneBoxProblems([issue('248-a-fade.md', '248: A fade', 'ready-for-human · enhancement.', '\n- [ ] Not yet')])).toEqual([]);
  });
});

describe('the check before a commit (issue 261)', () => {
  const docs = [issue('70-short-title.md', '70: Short title', 'done (2026-10-28).', '\n- [ ] Unticked')];

  it('fails while a page is stale or a done issue leaves a box unticked', () => {
    expect(recordProblems(docs, { index: issueIndex(docs), calls: openCalls(docs) })).toHaveLength(1);
    expect(recordProblems(docs, { index: 'old', calls: undefined })).toEqual([
      'docs/issues.md is stale: run `npm run issues` and commit it.',
      'docs/open-calls.md is stale: run `npm run issues` and commit it.',
      expect.stringMatching(/^docs\/issues\/70-short-title.md is done with a box unticked/),
    ]);
  });
});
