# 217: A MIDI message redraws only the MIDI panel

**What to build:** Part (a) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 9's finding on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that every MIDI message re-renders the whole page: 1,250 aftertouch messages gave 1,063 React commits. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Agent Brief

**Category:** enhancement
**Summary:** The MIDI Activity line (the last message heard) is kept at the top of the app, so each MIDI message re-renders the whole page.

**Current behavior:** The Activity line lives in the app's own state; every message, a stream of aftertouch or a clock's 24 ticks a beat, commits the whole tree.

**Desired behavior:**
- The Activity line is kept in a small store of its own, read only where it is shown (the MIDI panel), so a message re-renders that line alone.
- What the panel shows, and when, is unchanged.

**Key interfaces:**
- The MIDI hook's Activity line
- The MIDI panel that shows it

**Acceptance criteria:**
- [ ] A test: a stream of MIDI messages does not re-render the app, only the Activity line
- [ ] The MIDI panel's tests pass unchanged (the line reads as before)

**Out of scope:**
- The sound's writes ([218](./218-a-change-writes-only-what-it-changes.md), [219](./219-aftertouch-glides.md))
