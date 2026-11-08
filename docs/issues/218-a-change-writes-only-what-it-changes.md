# 218: A change writes only what it changes

**What to build:** Part (b) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 18's finding 2 on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that each Demo knob tick rewrites the whole Patch, about 10,600 AudioParam calls a second. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

From 183 (Claude's calls, let stand by the owner in 1.23.0, 2026-11-02):

1. **One write per parameter and frame** at most, and only of what changed.

Claude's call, let stand by the owner in 1.23.0 (2026-11-03):

2. **Where the writes are gathered into one a frame,** in the engine or before it, is settled first, written in the issue with the reason, before the rest is built.

Settled the night of 2026-11-03, before the rest was built (Claude's call, let stand by the owner in 1.24.0):

3. **In the engine, with no frame gate before it.** Applying a Patch remembers what each AudioParam was last given and skips a write that would leave it as it is; a change that does alter it is written at once, as now. The engine is the one place that knows which AudioParams a knob reaches: one knob reaches several (the Volume scales each LFO's swing of it), several knobs reach one (the Effective Cutoff), so a diff of the Patch's fields made before the engine would still have to be mapped onto its writes there. A gate before it (one write a `requestAnimationFrame`) would hold the sound and the Modulation model a frame behind the Patch store, which hands every change on at once (ADR-0013), and would stop in a hidden tab, where the Demo plays on. The sources already come at most once a frame: the Demo's tick every 40 ms, a hand's drag one pointer event a frame. A Controller's knob keeps its immediate writes (183, decision 3): one sending faster than the frames writes its own parameter at each message, and nothing else.
4. **A whole new Patch (a Preset, Init, a Tutorial's Step, the Tour's restore) forgets what was written** and writes every parameter again, as before: a load is where the engine starts from nothing.

## Agent Brief

**Category:** enhancement
**Summary:** A change to one control writes every parameter of every Voice, and the Demo's knob moves do so 25 times a second.

**Current behavior:** Applying a Patch writes every AudioParam of all 8 Voices on each change; the Demo's 40 ms tick applies it each time.

**Desired behavior:**
- A change writes only the parameters it changes, at most once a frame each.
- The sound is the same as now, and the Modulation model still mirrors it (ADR-0003).
- A whole new Patch (a Preset loaded, Init, a Tutorial's Step) is still written whole.

**Key interfaces:**
- The engine's applying of a Patch
- The Demo's knob tick

**Acceptance criteria:**
- [x] An engine test counting writes: a Demo knob tick writes only the changed parameters
- [x] The Demo's calls a second measured before and after, the figures in the issue
- [x] The Modulation model matches the sound in the engine tests; every test passes

**Out of scope:**
- Aftertouch ([219](./219-aftertouch-glides.md))
- The MIDI Activity line ([217](./217-a-midi-message-redraws-only-the-midi-panel.md))

## How it was built

The night of 2026-11-03, on `night/2026-11-03`.

**What was built.**
- **The engine skips a write that would change nothing.** It remembers what it last gave each AudioParam that only applying a Patch sets, and from when. A value that is the same, at the same time or later, is not written again. A write scheduled earlier than the last one (aftertouch can be scheduled ahead) is always made.
- **Values that are worked out are written only when their inputs change.** These are:
  - FM's gain and each LFO's swing of it, which are also written at every Note. One at nothing stays at nothing.
  - each LFO oscillator's Rate and Waveform, recorded per oscillator, pulls onto the beat and restarts included;
  - the Response Curve's twin filters.
- **A whole new Patch forgets all of it and writes whole.** That means the first Patch, a load (a Preset, Init, the Tour's Patch and its restore) and a Tutorial's Step. The Patch store marks each one `whole`.
- **Engine tests in `writesOnlyChanges`.** Applying the same Patch again writes nothing, for every Preset. Each knob the Demo turns, in its own part, writes on one tick only AudioParams whose value it changes, and less than a tenth of a whole Patch. A Cutoff tick writes exactly one value per Voice. A load writes whole. A Cutoff turned away and back sounds the same as one that stayed.

**The calls (Claude's call, let stand by the owner in 1.24.0).**
- Decisions 3 and 4 above: the writes are gathered in the engine, with no frame gate, and a load writes whole.
- A Tutorial's Step counts as a whole Patch, as the brief listed, even when it moves one knob. It sounds the same as writing only what changed.
- A Controller's knob that sends faster than the frames still writes its one parameter at each message. Only that parameter, but not once a frame.

**The figures.**
- AudioParam calls a second during the Demo: about **14,500 before**, about **600 after**, 24 times fewer. Headless Chromium, the built site, 20 s from 3 s after Demo was pressed (the Kick intro into the Acid build), two runs each, load 2 to 5.
  - Before: setValueAtTime 14,321 to 14,366, cancelAndHoldAtTime 148.
  - After: setValueAtTime 496 to 499, cancelAndHoldAtTime 68.
  - The rest is the same in both: what the Notes and their Envelopes write.
- Review 18 counted about 10,600 on 1.21.1, over its own window on the published site. The method is the same (AudioParam's scheduling methods wrapped), the window and the build are not, so the two counts are not comparable.
- setPeriodicWave stays at 17 a second: those come from the Notes.

**Tests.** `npx tsc`, the lint, and every Vitest project: 1,786 tests passed. Playwright in Chromium and WebKit: demo, song, patches, tutorial, tour, knob, lfo, voices, smoke, filterMode, oscillator, tempo and midiKeyboard.
- Chromium: 213 passed.
- WebKit: 206 passed and 6 skipped. One failure was a load flake: demo's "Page Down is a scroll of the person's own" (issue 227) failed beside the others at a load of about 8, then passed 3 times out of 3 when run alone.

**To try in the app.**
- Play the Demo through: it should sound as it did, the Acid build's Cutoff and Resonance sweeps and the wobbles above all.
- Turn knobs by hand and from a Controller while Notes sound, aftertouch included.
- Load Presets and step through a Tutorial: each should sound like itself.

