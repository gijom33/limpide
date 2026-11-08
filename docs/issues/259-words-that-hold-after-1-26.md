# 259: Words that hold after 1.26

**What to build:** Findings of the full review round on 1.26.1 on what the site and the repository claim (the inbox, 2026-11-07; reviews [4](../reviews/2026-11-07/4-ai-expert.md), [7](../reviews/2026-11-07/7-recruiter.md) and [11](../reviews/2026-11-07/11-oss-legal.md)):

1. **About's "nothing that identifies you" and SECURITY.md's "an anonymous visit count"** claim more than the README's accurate "receives each visitor's IP address and browser" (review 11).
2. **The README says every commit names Claude Code,** but 8 night merge commits carry no Co-Authored-By line (review 4).
3. **A trademark line** in About and the README: product names are their owners', Limpide is not affiliated (review 11).
4. **The README's licence line** to keep the docs' quotations their authors' (review 11). The AI-authorship copyright wording stays parked for a lawyer, by [111](./111-the-repository-front-page-and-community-files.md)'s decision 4.
5. **The README's CPU figure** (112.3 % of a processor core when reviewed, 107.8 % since 1.26.2's statistics) in plain words, or left to the statistics page (review 7).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** Five claims in About, SECURITY.md and the README made true: the privacy wording, the commit credit, a trademark line, the quotations' licence, and the CPU figure.

**Current behavior:** As the five items above say.

**Desired behavior:**
- About and SECURITY.md say what the README says: the host receives each visitor's IP address and browser; Limpide itself keeps nothing that identifies a person.
- The README's commit claim matches the history: either "every commit Claude wrote", with the night merges named as the exception, or the merges given the line from now on and the claim worded to match.
- One trademark sentence in About and the README.
- The README's licence line says the quotations in the docs stay their authors'. The copyright wording itself is not changed.
- The README's CPU figure in plain words ("about one core of a laptop while the Demo plays") or a link to the statistics page instead.

**Key interfaces:**
- About's words
- SECURITY.md
- The README

**Acceptance criteria:**
- [ ] ~~The word checks of the release steps (ripple hunter, fact-checker) find no claim left that the code or the history contradicts~~ (the next release's word checks, after this was built)
- [x] About's tests still pass

**Out of scope:** the copyright wording ([111](./111-the-repository-front-page-and-community-files.md)'s decision 4, for a lawyer); the statistics' figure itself ([257](./257-cheaper-at-rest-after-1-26.md)).

## How it was built

Words only, in About, SECURITY.md, the README and the statistics' README summary; the copyright wording is untouched (111's decision 4).

1. **Privacy:** About and SECURITY.md now say what the README says, and all three name the host: "no cookies, and no personal data stored. Like any web page, the site's host (GitHub Pages) and the counter receive each visitor's IP address and browser". SECURITY.md adds "Limpide itself keeps nothing that identifies a person", and "no server of its own" in place of "no server".
2. **The commit credit:** the history has eight commits without the `Co-Authored-By` line, all of them merges of one branch into another from 2026-10-30 to 2026-11-01; every merge since carries it. The README now says so: "Every commit names Claude Code in its `Co-Authored-By` line, but for eight merges of one branch into another, from 2026-10-30 to 2026-11-01."
3. **Trademarks:** a Trademarks row in About's credits and a closing sentence in the README: product names are their owners' trademarks; Limpide is not affiliated with or endorsed by them.
4. **The quotations:** the README's licence line adds "the quotations in the docs stay their authors', under their own terms"; About's License row, which says "the docs" too, adds "whose quotations stay their authors'".
5. **The CPU figure:** the README's summary now stops at "the Demo at 56 frames a second"; the CPU share stays on the statistics page, where its column says it counts all of Chromium's processes as a share of one core. `npm run stats` writes the summary that way from now on (its unit test changed first).

**Claude's calls, open to the owner:**

1. **The CPU figure left to the statistics page,** of the issue's two ways: plain words ("about one core of a laptop") would be a new claim about the machine it was measured on, which the page does not record.
2. **The commit claim worded to the history,** of the two ways: the merges since 2026-11-01 already carry the line, so nothing in the night shift changes; the sentence names the eight old ones.
3. **The host named:** review 11 noted that GitHub Pages receives every request too, which nothing said; "receive" says no more than any web server does, and makes no claim about what GitHub logs.
4. **About gets the quotations clause too,** as its License row claims the docs as the README's did; and the trademark line is its own row in About's credits, which scroll on a short phone.

**What to try in the app:** open About (the logo) and read its License, Trademarks and Privacy rows (Privacy shows only on the published site); on a 393 × 540 phone the Demo and Tour buttons should still be on the first screen, the credits scrolling. Read the README's "How this was built", statistics line and License, and SECURITY.md's "What there is to attack".
