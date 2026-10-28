import { describe, expect, it } from 'vitest';
import { inboxProblems, subjectProblem } from './commitChecks';

describe('a commit subject', () => {
  it('names its issue, or says it has none, in 72 characters or fewer', () => {
    expect(subjectProblem('Issue 69: the search\'s fixes after its review\n\nThe body.')).toBeNull();
    expect(subjectProblem('No issue: ADR-0012\n')).toBeNull();
    expect(subjectProblem(`No issue: ${'x'.repeat(62)}`)).toBeNull(); // 72 exactly
    expect(subjectProblem(`No issue: ${'x'.repeat(63)}`)).toMatch(/73 characters/);
    expect(subjectProblem('fix the search')).toMatch(/Issue N/);
    expect(subjectProblem('Issue 69:the search')).toMatch(/Issue N/);
  });

  it('skips the comments git adds, and passes git’s own merges, reverts and fixups', () => {
    expect(subjectProblem('# Please enter the commit message\nNo issue: a fix\n')).toBeNull();
    expect(subjectProblem("Merge branch 'main'")).toBeNull();
    expect(subjectProblem('Revert "Issue 69: the search"')).toBeNull();
    expect(subjectProblem('fixup! Issue 69: the search')).toBeNull();
  });
});

const inbox = (bugs: string[], ideas: string[], dropped: string[] = []) =>
  ['# Inbox', '', '## Bugs', '', ...bugs, '', '## Ideas', '', ...ideas, '', '## Dropped', '', ...dropped, ''].join('\n');
const TODAY = '2026-10-28';

describe('a commit that changes the inbox', () => {
  it('adds a Bug or an Idea alone', () => {
    const after = inbox([], ['- 2026-10-28, an idea']);
    expect(inboxProblems(inbox([], []), after, ['docs/inbox.md'], TODAY)).toEqual([]);
    expect(inboxProblems(inbox([], []), after, ['docs/inbox.md', 'src/ui/App.tsx'], TODAY)).toEqual([
      'A new Bug or Idea is committed alone: commit docs/inbox.md by itself first, then src/ui/App.tsx.',
    ]);
  });

  it('may triage with other files: lines leaving Bugs and Ideas, or going to Dropped', () => {
    const before = inbox(['- 2026-10-28, a bug'], []);
    const after = inbox([], [], ['- 2026-10-28, a bug: not one, Claude’s call']);
    expect(inboxProblems(before, after, ['docs/inbox.md', 'docs/issues/70-x.md'], TODAY)).toEqual([]);
  });

  it('never dates a line after today, in any section', () => {
    expect(inboxProblems(inbox([], []), inbox([], [], ['- 2026-10-29, dropped']), ['docs/inbox.md'], TODAY)).toEqual([
      'An inbox line is dated 2026-10-29, after today (2026-10-28): "- 2026-10-29, dropped".',
    ]);
    expect(inboxProblems('', '2026-10-29, triaged: a line', ['docs/inbox.md'], TODAY)).toHaveLength(1);
    expect(inboxProblems(inbox([], []), inbox(['- 2026-10-28, a bug'], []), ['docs/inbox.md'], TODAY)).toEqual([]);
  });
});
