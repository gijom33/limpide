# 261: How the work is recorded, after 1.26

**What to build:** The process ideas of the full review round on 1.26.1 that the owner kept (the inbox, 2026-11-07; reviews [4](../reviews/2026-11-07/4-ai-expert.md) and [10](../reviews/2026-11-07/10-methodology.md)):

1. **A queue of the calls open to the owner:** 225 lines still read "open to the owner" with nothing telling the ones the owner has seen from the ones not; two accepted ADRs (0020, 0021) still say open (reviews 4 and 10).
2. **"Done" with every acceptance box ticked or struck with a reason:** 68 of 201 done issues still have unticked boxes (review 10).
3. **An index of the issues** (number, title, Status), linked from the README (review 4).
4. **The README's "How this was built" naming the night shift** (review 4).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's process answers: these four kept, the others dropped).

## Agent Brief

**Category:** enhancement
**Summary:** One place listing the calls still open to the owner, done issues with every box ticked or struck, an index of the issues, and the README naming the night shift.

**Current behavior:** As the four items above say.

**Desired behavior:**
- One document lists every call still open to the owner, each with where it was made; a call the owner has since answered or let stand (a release that shipped it, an "All good") is marked so where it was made, and leaves the list. The two ADRs' Status lines say what the owner decided, the only change an accepted ADR may take.
- Every done issue's acceptance boxes ticked, or struck through with the reason; the release steps or the issue-tracker guide say a done issue has no unticked box.
- An index of the issues (number, title, Status's first words), kept by a script so it cannot drift, linked from the README.
- "How this was built" says what the night shift is, in a sentence or two, with a link to a morning report.

**Key interfaces:**
- The issue files' Status lines and acceptance boxes
- The ADRs' Status lines
- The README and the issue-tracker guide

**Acceptance criteria:**
- [ ] The open-calls list exists, each line linked; the owner goes through it (a human step)
- [ ] No done issue has an unticked box without a strike and a reason
- [ ] The index is generated and a check fails when it is stale
- [ ] The README names the night shift

**Out of scope:** merges waiting for the owner's play, failing tests committed first, a published roadmap, splitting the App component (all dropped by the owner, 2026-11-07).
