// The record the issue files keep, generated so it cannot drift (issue 261): the index of the issues (`docs/issues.md`),
// the calls still open to the owner (`docs/open-calls.md`), and a check that a done issue leaves no box unticked.
// `npm run issues` writes the two pages; `npm run issues:check` (and the pre-commit hook, on the staged files) fails
// when either is stale or a done issue has an unticked box.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** A Markdown file of the record: its path from the repository's root, and its text. */
export type Doc = { file: string; text: string };

export const INDEX = 'docs/issues.md';

const FINISHED = /^(done|closed|superseded|ongoing)\b/;

/** An issue's number, title and Status line, or null for a file that is not an issue. */
function issueOf({ file, text }: Doc) {
  const name = file.split('/').pop() ?? '';
  const heading = text.match(/^# (\d+): (.+)$/m);
  if (!/^\d+-.*\.md$/.test(name) || !heading) return null;
  const status = text.match(/^\*\*Status:\*\*\s*(.*)$/m)?.[1] ?? '';
  return { number: Number(heading[1]), title: heading[2].trim(), name, status };
}

/** Markdown's links reduced to their words, and its bold and code marks dropped. */
const plain = (markdown: string) =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|`/g, '')
    .trim();

/** A Status line's first words: its triage state and category, or its finished state and date. */
export function statusWords(status: string): string {
  const words = plain(status).split(/\.\s|[.;:,](?:\s|$)/)[0].trim();
  return [...words].length > 80 ? `${[...words].slice(0, 79).join('').trimEnd()}…` : words || '(no Status)';
}

const cell = (text: string) => text.replace(/\|/g, '\\|');

/** The index page: the open issues, then the finished ones, each by number with its title and Status's first words. */
export function issueIndex(docs: Doc[]): string {
  const issues = docs.flatMap((doc) => issueOf(doc) ?? []).sort((a, b) => a.number - b.number);
  const table = (rows: typeof issues) => [
    '| # | Issue | Status |',
    '| --: | --- | --- |',
    ...rows.map((i) => `| ${i.number} | [${cell(i.title)}](issues/${i.name}) | ${cell(statusWords(i.status))} |`),
    '',
  ];
  const open = issues.filter((i) => !FINISHED.test(plain(i.status)));
  const finished = issues.filter((i) => FINISHED.test(plain(i.status)));
  return [
    '# The issues',
    '',
    'Every issue in [docs/issues](issues), with its Status’s first words; the issue tracker’s guide is [docs/agents/issue-tracker.md](agents/issue-tracker.md).',
    'Generated from the issue files by `npm run issues`: edit an issue, not this page.',
    '',
    `## Open (${open.length})`,
    '',
    ...table(open),
    `## Done, closed, superseded or ongoing (${finished.length})`,
    '',
    ...table(finished),
  ].join('\n');
}

export const OPEN_CALLS = 'docs/open-calls.md';

/** A call still open: the phrase, unless it only names the calls ("the calls still open to the owner") or is quoted. */
const OPEN = /open to the owner/i;
const SPOKEN_OF = /\b(the|every) calls? (still )?open to the owner|["“`](Claude['’]s calls?, )?open to the owner["”`]/gi;
const LIST_ITEM = /^(\s*)(\d+\.|[-*])\s+/;
const indent = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;

const excerpt = (line: string) => {
  const text = plain(line.replace(LIST_ITEM, '')).replace(/^Status:\s*/, '');
  return [...text].length > 240 ? `${[...text].slice(0, 239).join('').trimEnd()}…` : text;
};

/** Where a file's calls were made, as the list names it, and its link from `docs/`. */
function placeOf(file: string, text: string) {
  const link = file.replace(/^docs\//, '');
  const adr = file.match(/adr\/(\d{4})-/);
  if (adr) return { place: `ADR-${adr[1]}`, link, order: [1, Number(adr[1])] };
  const issue = text.match(/^# (\d+):/m);
  if (issue && file.startsWith('docs/issues/')) return { place: `Issue ${issue[1]}`, link, order: [0, Number(issue[1])] };
  return { place: 'Inbox', link, order: [2, 0] };
}

/**
 * One file's open calls: each line that holds one, or for a heading of calls ("Claude's calls, open to the owner:"), each
 * item under it. An ADR's calls are in its Status line, the one line an accepted ADR may change.
 */
function callsIn({ file, text }: Doc) {
  const { place, link, order } = placeOf(file, text);
  const lines = text.split('\n');
  const taken = new Set<number>();
  const calls: { label: string; text: string }[] = [];
  let section = '';
  const adr = place.startsWith('ADR');
  lines.forEach((line, i) => {
    if (line.startsWith('## ')) section = line;
    if (taken.has(i) || (adr && !line.startsWith('**Status:**')) || !OPEN.test(line.replace(SPOKEN_OF, ''))) return;
    const header = /^#/.test(line) || /:\s*$/.test(plain(line));
    const items = header ? itemsUnder(lines, i) : [];
    for (const j of items) taken.add(j);
    for (const j of items) {
      const number = lines[j].match(LIST_ITEM)?.[2].match(/^\d+/)?.[0];
      calls.push({ label: number ? `${place}, call ${number}` : place, text: excerpt(lines[j]) });
    }
    if (items.length > 0) return;
    const number = indent(line) === 0 ? line.match(/^(\d+)\./)?.[1] : undefined;
    const date = place === 'Inbox' ? line.match(/^(?:- )?(\d{4}-\d{2}-\d{2})/)?.[1] : undefined;
    const label = line.startsWith('**Status:**')
      ? `${place}, Status`
      : number
        ? `${place}, ${/decision/i.test(section) ? 'decision' : 'item'} ${number}`
        : date
          ? `${place}, ${date}`
          : place;
    calls.push({ label, text: excerpt(line) });
  });
  return { place, link, order, calls };
}

/** The lines of the list right under a heading of calls, at the list's own depth. */
function itemsUnder(lines: string[], header: number): number[] {
  const deeperThan = LIST_ITEM.test(lines[header]) ? indent(lines[header]) : -1;
  let j = header + 1;
  while (j < lines.length && lines[j].trim() === '') j++;
  if (!LIST_ITEM.test(lines[j] ?? '') || indent(lines[j]) <= deeperThan) return [];
  const depth = indent(lines[j]);
  const items: number[] = [];
  for (; j < lines.length; j++) {
    const line = lines[j];
    if (line.trim() === '') {
      const next = lines.slice(j + 1).find((l) => l.trim() !== '');
      if (next && LIST_ITEM.test(next) && indent(next) === depth) continue;
      break;
    }
    if (indent(line) > depth) continue;
    if (indent(line) < depth || !LIST_ITEM.test(line)) break;
    items.push(j);
  }
  return items;
}

/** The page of the calls still open to the owner, from the issues, the inbox and the ADRs. */
export function openCalls(docs: Doc[]): string {
  const places = docs
    .map(callsIn)
    .filter((p) => p.calls.length > 0)
    .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1]);
  const count = places.reduce((n, p) => n + p.calls.length, 0);
  return [
    '# Calls open to the owner',
    '',
    `${count} calls open to the owner, in ${places.length} places: each a choice Claude made without the owner (“Claude’s call, open to the owner”), as it reads where it was made.`,
    '',
    'The owner goes through them. A call closes where it was made, its “open to the owner” becoming “accepted by the owner (YYYY-MM-DD)” or “reversed by the owner (YYYY-MM-DD, issue N)”, or, once a release has shipped it with no word on it, “let stand by the owner in X.Y.Z”; the issue tracker’s guide says how ([docs/agents/issue-tracker.md](agents/issue-tracker.md)).',
    'Generated from the issues, the inbox and the ADRs by `npm run issues`: close a call where it was made, not on this page.',
    '',
    ...places.flatMap((p) => p.calls.map((c) => `- [${c.label}](${p.link}): ${c.text}`)),
    '',
  ].join('\n');
}

/** A box left unticked, and one struck through with its reason after it, which may stay unticked. */
const UNTICKED = /^\s*[-*] \[ \] /;
const STRUCK = /^\s*[-*] \[ \] ~~.+~~\s*\S/;

/** What is wrong with the done issues' boxes: a done issue has each box ticked, or struck through with the reason. */
export function doneBoxProblems(docs: Doc[]): string[] {
  return docs.flatMap((doc) => {
    const issue = issueOf(doc);
    if (!issue || !/^done\b/.test(plain(issue.status))) return [];
    return doc.text
      .split('\n')
      .filter((line) => UNTICKED.test(line) && !STRUCK.test(line))
      .map(
        (line) =>
          `${doc.file} is done with a box unticked; tick it or strike it with the reason (\`- [ ] ~~…~~ (not checked at the time)\`): "${line.trim().slice(0, 100)}".`,
      );
  });
}

/** What is wrong with the record, given the two pages as they are (undefined: missing). */
export function recordProblems(docs: Doc[], pages: { index?: string; calls?: string }): string[] {
  const stale = (file: string) => `${file} is stale: run \`npm run issues\` and commit it.`;
  return [
    ...(pages.index === issueIndex(docs) ? [] : [stale(INDEX)]),
    ...(pages.calls === openCalls(docs) ? [] : [stale(OPEN_CALLS)]),
    ...doneBoxProblems(docs),
  ];
}

/** The record's source files: the issues, the inbox and the ADRs. */
const isSource = (file: string) => /^docs\/(issues|adr)\/[^/]+\.md$/.test(file) || file === 'docs/inbox.md';
const touchesRecord = (file: string) => isSource(file) || file === INDEX || file === OPEN_CALLS;

/** The files as the working tree has them. */
function workingTree(): { docs: Doc[]; read: (file: string) => string | undefined } {
  const read = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);
  const files = ['docs/issues', 'docs/adr'].flatMap((dir) => readdirSync(dir).map((name) => `${dir}/${name}`));
  const docs = [...files, 'docs/inbox.md'].filter(isSource).map((file) => ({ file, text: read(file) ?? '' }));
  return { docs, read };
}

/** The files as they are staged, read in one `git cat-file --batch`. */
function staged(): { docs: Doc[]; read: (file: string) => string | undefined } {
  const entries = execFileSync('git', ['ls-files', '-s', '--', 'docs/issues', 'docs/adr', 'docs/inbox.md', INDEX, OPEN_CALLS], { encoding: 'utf8' })
    .split('\n')
    .flatMap((line): [string, string][] => {
      const entry = line.match(/^\d+ ([0-9a-f]+) \d+\t(.+)$/);
      return entry && touchesRecord(entry[2]) ? [[entry[1], entry[2]]] : [];
    });
  const batch = execFileSync('git', ['cat-file', '--batch'], { input: entries.map(([hash]) => hash).join('\n'), maxBuffer: 1 << 28 });
  const texts = new Map<string, string>();
  let at = 0;
  for (const [, file] of entries) {
    const end = batch.indexOf(10, at);
    const size = Number(batch.subarray(at, end).toString().split(' ')[2]);
    texts.set(file, batch.subarray(end + 1, end + 1 + size).toString('utf8'));
    at = end + 1 + size + 1;
  }
  const docs = [...texts].filter(([file]) => isSource(file)).map(([file, text]) => ({ file, text }));
  return { docs, read: (file) => texts.get(file) };
}

// `npm run issues` writes the two pages; `check` checks the working tree, and `check --staged` (the pre-commit hook)
// the staged files, only when the commit touches the record.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, option] = process.argv.slice(2);
  if (command === 'check') {
    const stagedFiles = option === '--staged' ? execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' }).split('\n') : [];
    if (option === '--staged' && !stagedFiles.some(touchesRecord)) process.exit(0);
    const { docs, read } = option === '--staged' ? staged() : workingTree();
    const problems = recordProblems(docs, { index: read(INDEX), calls: read(OPEN_CALLS) });
    for (const problem of problems) console.error(problem);
    process.exit(problems.length > 0 ? 1 : 0);
  }
  const { docs } = workingTree();
  writeFileSync(INDEX, issueIndex(docs));
  writeFileSync(OPEN_CALLS, openCalls(docs));
  console.log(`Wrote ${INDEX} and ${OPEN_CALLS}.`);
}
