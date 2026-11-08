# 263: The e2e tests wait on state

**What to build:** Half of review 8's last idea on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/8-oss-sceptic.md)): the e2e tests' fixed sleeps, up from 56 to 96 since 1.16.0, made waits on the state they stand in for. Fixed sleeps are where GitHub's slower machines have gone red before ([224](./224-tests-steady-on-githubs-webkit.md), [232](./232-1-24-0-red-on-githubs-linux-webkit.md), [240](./240-the-demo-54-px-off-on-a-slow-phone.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish of the tests ([131](./131-v1.md)): Claude's call, let stand by the owner in 1.26.2 (2026-11-07; the triage's questions did not name it). The other half, Bead behind one module, is dropped (the inbox).

## Agent Brief

**Category:** enhancement
**Summary:** Replace the e2e tests' fixed sleeps with waits on what each sleep is waiting for.

**Current behavior:** 96 fixed sleeps in the e2e specs, each a guess at how long something takes.

**Desired behavior:**
- Each sleep that waits for a state (a class, a value, an attribute, an animation's end, an audio event) waits on that state instead.
- A sleep that measures time itself (a hold, a timing claim) stays, with a comment saying so.
- No test slower in all, none flakier.

**Key interfaces:**
- The e2e specs and their shared helpers

**Acceptance criteria:**
- [ ] The count of fixed sleeps falls, each one left commented with why
- [ ] The whole Playwright suite green locally in both engines, and on GitHub's branch run

**Out of scope:** the app's code.
