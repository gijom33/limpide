# 238: Tidy-ups after 1.24

**What to build:** What the 1.24.0 code review (standards and spec, since v1.23.0) and its word checks left, none holding the release (inbox, 2026-11-04). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (the same code; build after it is merged; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement. Polish for v1

## What is left, and what to do

From the code review:

1. **218's bare flags** (`apply(start.patch, true)` and the like) where the engine takes `{ whole }`: named options at every call.
2. **218's four memos in the engine** ("remember a key, skip if unchanged"), `follows`/`following` for the LFOs' last Rate and Waveform, and `ALL_FM`: one small memo shape for the four, and names that say what they hold.
3. **"Silent" asked twice with two thresholds** (213, 214): one definition of a silent Viewer, used by both.
4. **216's hand-kept list of the engine's methods that wake it** (all nine there today): a test that fails when a method that makes sound does not wake the engine, or the wake moved to where every such method passes.
5. **227's `SOUND_KEYS` alias and its "step around 0" test** reading "within 15 of the top": the alias gone, the test named for what it checks.
6. **223's Switches listed in the MIDI code:** beside the choices they belong to, so a new Switch cannot be missed.
7. **Two boxes overstating:** 224's "no timing step … in round trips with waits" (four fixed waits are left in the mascot spec) and 214's "Viewer tests pass unchanged" (one was edited): the four waits made waits for what they read, and 214's box worded as it was.
8. **216's first Note after the pause** is on time on the audio clock only (1.5 ms late in Chromium, 7 to 17 ms in WebKit), and a Controller's Note has no early wake: the engine wakes on any MIDI message, not only on a Note it plays (Claude's call, open to the owner).
9. **A paused Viewer rests without comparing the Harmonics and Ideal settings** (214, 216): turning either redraws a resting Viewer.
10. **217's test renders the hook, not the app:** a test through the app that a MIDI message redraws only the MIDI panel.
11. **221's Demo with Bead off,** 6.79 to 7.77 style recalculations a frame, untraced: traced once, the cause written here, fixed if it is ours.

From the word checks:

12. **Riser's description, "from 200 Hz past 5 kHz",** true near C4 only since its Key Track is 0.5 (C2 to 2.69 kHz, C6 to 10.8 kHz): say where it holds ("on C4").
13. **The shipped issues' Status lines keep "merged into main, not yet released"** after their release, 1.23.0's and 1.24.0's too: [the release steps](../releasing.md) gain a step that brings them up to date, and the stale ones are.

Dropped: 227's commit changing the knob's mode test before ADR-0021 came (already committed, nothing to build). Done at once: 204's and 212's boxes ticked.

## Agent Brief

**Category:** enhancement
**Summary:** Thirteen small tidy-ups from 1.24.0's code review and word checks: clearer names and options in the engine, one definition of silence, the engine's wake made hard to miss, a few tests made to test what they say, and two docs brought up to date.

**Current behavior:** As listed above, item by item.

**Desired behavior:** Each numbered item done as its line says, each its own commit; every test still green; no change heard or seen except items 8 and 9 (a Controller's first Note after the pause on time; a resting Viewer redrawn when Harmonics or Ideal is turned).

**Out of scope:** the engine's design beyond these lines; the sounds the ear check found (issue 239).
