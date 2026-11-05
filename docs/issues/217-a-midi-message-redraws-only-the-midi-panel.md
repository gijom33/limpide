# 217: A MIDI message redraws only the MIDI panel

**What to build:** Part (a) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 9's finding on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that every MIDI message re-renders the whole page: 1,250 aftertouch messages gave 1,063 React commits. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

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
- [x] A test: a stream of MIDI messages does not re-render the app, only the Activity line
- [x] The MIDI panel's tests pass unchanged (the line reads as before)

**Out of scope:**
- The sound's writes ([218](./218-a-change-writes-only-what-it-changes.md), [219](./219-aftertouch-glides.md))

## How it was built

- The last message heard is kept in a small store of its own, made with the MIDI hook and held for its whole life. The MIDI panel's Activity line alone reads it, so a message redraws that line and nothing else: not the page, nor the rest of the panel.
- The hook still tells the page once that a keyboard has pressed (the Timeline then draws what aftertouch moves), and no more after that. Setting the same value again on every aftertouch could still make React render the page once more before it noticed nothing had changed.
- What the panel shows, and when, is unchanged: the same line, "Nothing received yet" before the first message, and the same text after each message.
- Tests: a new test sends a stream of 50 aftertouch messages and a CC, and checks that the page does not render again while the line moves on. The Activity Monitor's end-to-end test passes unchanged, in Chromium and WebKit.

Calls made (Claude's call, open to the owner):
1. Only the Activity line redraws, not the whole MIDI panel. The issue's title says "the MIDI panel", but its brief asks for "that line alone".
2. A MIDI clock never touched the Activity line: its ticks go to the tempo. The page still renders once a beat when the clock moves the BPM. That is outside this issue, and it happens once a beat, not 24 times.

**To try in the app:** open the MIDI panel with a Controller connected, then play, press keys with aftertouch, and turn knobs. The "Last message" line should follow each message as before. Hold a key and lean on it: the sound and the page should keep up, with no stutter in the viewers.
