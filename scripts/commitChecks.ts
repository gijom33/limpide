// The commit rules a script can check (CLAUDE.md, ADR-0010), run by the hooks in `.githooks/`: a commit subject that
// names its issue in 72 characters or fewer, and an inbox line committed alone and never dated after today. Every
// review from 1.12 to 1.14 found one of them slipped by hand.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const INBOX = 'docs/inbox.md';

/** What is wrong with a commit message's subject, or null. Git's own merges, reverts and fixups pass as they are. */
export function subjectProblem(message: string): string | null {
  const subject = message.split('\n').find((line) => line.trim() !== '' && !line.startsWith('#')) ?? '';
  if (/^(Merge|Revert) |^(fixup|squash|amend)! /.test(subject)) return null;
  if (!/^(Issue \d+|No issue): \S/.test(subject)) return `The subject starts with "Issue N: " or "No issue: ": "${subject}".`;
  const length = [...subject].length;
  if (length > 72) return `The subject is ${length} characters, over 72: "${subject}".`;
  return null;
}

/** The lines the commit adds to the inbox, each with the section (`## Bugs`, `## Ideas`…) it sits under. */
function addedLines(before: string, after: string) {
  const old = new Set(before.split('\n'));
  let section = '';
  const added: { line: string; section: string }[] = [];
  for (const line of after.split('\n')) {
    if (line.startsWith('## ')) section = line.slice(3).trim();
    else if (line.trim() !== '' && !old.has(line)) added.push({ line, section });
  }
  return added;
}

/**
 * What is wrong with a commit that changes the inbox: a new Bug or Idea committed with other files (the owner's words
 * go in alone, then triage), or a line dated after `today` (YYYY-MM-DD).
 */
export function inboxProblems(before: string, after: string, staged: string[], today: string): string[] {
  const problems: string[] = [];
  const added = addedLines(before, after);
  const others = staged.filter((file) => file !== INBOX);
  if (others.length > 0 && added.some(({ section }) => section === 'Bugs' || section === 'Ideas'))
    problems.push(`A new Bug or Idea is committed alone: commit ${INBOX} by itself first, then ${others.join(', ')}.`);
  for (const { line } of added) {
    const date = line.match(/^(?:- )?(\d{4}-\d{2}-\d{2})/)?.[1];
    if (date && date > today) problems.push(`An inbox line is dated ${date}, after today (${today}): "${line.slice(0, 80)}".`);
  }
  return problems;
}

const git = (...args: string[]) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

// Run by a hook: `commit-msg <file>` checks the subject, `inbox` the staged inbox.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [check, file] = process.argv.slice(2);
  let problems: string[] = [];
  if (check === 'commit-msg') problems = [subjectProblem(readFileSync(file, 'utf8'))].filter((p) => p !== null);
  else if (check === 'inbox') {
    const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
    if (staged.includes(INBOX)) problems = inboxProblems(git('show', `HEAD:${INBOX}`), git('show', `:${INBOX}`), staged, new Date().toLocaleDateString('sv'));
  }
  for (const problem of problems) console.error(problem);
  process.exit(problems.length > 0 ? 1 : 0);
}
