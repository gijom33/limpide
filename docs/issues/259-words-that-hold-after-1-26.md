# 259: Words that hold after 1.26

**What to build:** Findings of the full review round on 1.26.1 on what the site and the repository claim (the inbox, 2026-11-07; reviews [4](../reviews/2026-11-07/4-ai-expert.md), [7](../reviews/2026-11-07/7-recruiter.md) and [11](../reviews/2026-11-07/11-oss-legal.md)):

1. **About's "nothing that identifies you" and SECURITY.md's "an anonymous visit count"** claim more than the README's accurate "receives each visitor's IP address and browser" (review 11).
2. **The README says every commit names Claude Code,** but 8 night merge commits carry no Co-Authored-By line (review 4).
3. **A trademark line** in About and the README: product names are their owners', Limpide is not affiliated (review 11).
4. **The README's licence line** to keep the docs' quotations their authors' (review 11). The AI-authorship copyright wording stays parked for a lawyer, by [111](./111-the-repository-front-page-and-community-files.md)'s decision 4.
5. **The README's CPU figure** (112.3 % of a processor core when reviewed, 107.8 % since 1.26.2's statistics) in plain words, or left to the statistics page (review 7).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

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
- [ ] The word checks of the release steps (ripple hunter, fact-checker) find no claim left that the code or the history contradicts
- [ ] About's tests still pass

**Out of scope:** the copyright wording ([111](./111-the-repository-front-page-and-community-files.md)'s decision 4, for a lawyer); the statistics' figure itself ([257](./257-cheaper-at-rest-after-1-26.md)).
