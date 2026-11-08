# Issue tracker: local Markdown in `docs/issues/`

The owner's issues and specs live as Markdown files in this repository ([ADR-0012](../adr/0012-following-the-ai-hero-skills.md)). GitHub Issues are for visitors: a visitor's issue that is taken up gets a line in the inbox and, if it grows, a file here.

## Where things are

- **The spec:** [`docs/prd.md`](../prd.md), one for the whole product. A bigger feature's spec is its issue's "What to build" and Decisions.
- **Issues:** one file each, `docs/issues/NN-<slug>.md`, numbered on from the highest (two digits until 99). Never a combined tickets file.
- **The inbox:** [`docs/inbox.md`](../inbox.md), the `needs-triage` queue. The owner's bug or idea goes in, in the owner's words, committed alone; triage is the next commit (an issue, a line in an existing issue, done at once, or Dropped with the reason). Done at once is for what needs no issue (below).
- **Rejected feature ideas:** [`.out-of-scope/`](../../.out-of-scope/), one file per concept.
- **The index** ([`docs/issues.md`](../issues.md)) and **the calls open to the owner** ([`docs/open-calls.md`](../open-calls.md)): written from the files by `npm run issues`, never by hand (issue 261). The pre-commit hook fails a commit of the issues, the inbox or the ADRs while either is stale, or while a done issue has an unticked box.

## An issue's file

```markdown
# 70: Short title

**What to build:** what and why, with the owner's words when it came from the inbox.

**Blocked by:** none, or the issues it waits on (`[68](./68-lfo-destinations-in-one-list.md)`)

**Status:** ready-for-agent · enhancement

## Agent Brief
…

## Decisions (grilling, YYYY-MM-DD, decided by the owner)
1. …
```

- **The Status line** of an open issue starts with one triage state and one category, from [`triage-labels.md`](./triage-labels.md), then any prose: `**Status:** ready-for-human · enhancement. Built, to verify on the real C16.` A finished issue's Status starts `done`, `closed` or `superseded`, with the date and what happened, and is not rewritten later. A done issue has no unticked box: each is ticked, with the evidence it was met in "How it was built" or a test, or struck through with the reason (`- [ ] ~~The criterion~~ (not checked at the time)`).
- **A `ready-for-agent` issue** carries an `## Agent Brief` (the triage skill's AGENT-BRIEF.md): behaviour, interfaces, acceptance criteria, out of scope; no file paths or line numbers.
- **Decisions** from a grilling go in a numbered list, each saying who decided ("decided by the owner", or "Claude's call, open to the owner").
- **A call closes where it was made:** its "open to the owner" becomes "accepted by the owner (YYYY-MM-DD)" or "reversed by the owner (YYYY-MM-DD, issue N)" when the owner rules on it, or "let stand by the owner in X.Y.Z" once a release has shipped it with no word on it. An ADR's calls are in its Status line, the one line an accepted ADR may change. A heading of calls ("Claude's calls, open to the owner:") closes with its list. Then `npm run issues` drops it from the open calls.
- **A decision about where something goes on screen** is measured before it is written: check it against the page at the widths it names (a quick measurement in the browser, the elements' boxes and the room around them). A place with no room is a question for the owner, not a decision.
- **Notes added later** go under a heading of their own at the bottom (`## How it was built`, `## Comments`); file paths belong there.

## When a change overturns an issue

- **A change that needs an issue:** one that alters an issue's decision, adds or changes a setting the page offers, or adds, cuts or reworks a batch of Presets (two or more) gets an issue number, even when it is done at once: a new issue, or a line in the issue it changes, and its commits start `Issue N:`. `No issue:` is for a change that overturns nothing an issue says: a typo, a steadier test, the docs catching up with the code, the tooling.
- **"Since then":** an issue whose decision, ticked box or built behaviour a later change overturns gets a line beside what it overturns or at its bottom, in the same commit as the change: `**Since then (YYYY-MM-DD, issue N):** what is now true, and who decided.` Its decision and its box stay as they were, so the record reads in order. An open issue whose look or behaviour the change replaced says so in its Status line too, so the owner is not asked to judge what no longer ships.

## Queries

- What waits on the owner: `grep -l '^\*\*Status:\*\* ready-for-human' docs/issues/*.md`
- What a fresh session can take: `grep -l '^\*\*Status:\*\* ready-for-agent' docs/issues/*.md`
- Every open issue: `grep -L '^\*\*Status:\*\* \(done\|closed\|superseded\|ongoing\)' docs/issues/*.md`, or the index's Open table
- The calls waiting on the owner: [`docs/open-calls.md`](../open-calls.md)

## When a skill says "publish to the issue tracker"

Create the next numbered file in `docs/issues/`, with a Status line, and commit it as `Issue N: …`.

## When a skill says "fetch the relevant ticket"

Read `docs/issues/NN-*.md`. The owner usually gives the number.

## Wayfinding operations

Used by `/wayfinder`, not yet run here. The map is an issue file whose "What to build" holds the Notes, Decisions so far and Fog; each child is an issue file with `**Part of:** [NN](./NN-….md)` and a `**Blocked by:**` line. A child is unblocked when every issue it lists is done; the frontier is the open, unblocked children, lowest number first. Resolving a child writes its answer under `## Answer`, sets its Status to `done`, and adds a one-line pointer to the map's Decisions so far.
