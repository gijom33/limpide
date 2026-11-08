# 248: A crossfade on a change of Filter Mode

**What to build:** From [231](./231-a-band-pass-not-so-much-quieter.md)'s decision 8, decided by the owner (2026-11-06, "Yes to all four"): the Filter's stages swap Mode at one sample, so a change of Mode while a Note holds can click. Since 231 made the band-pass louder at high Resonance, switching from it back to the low-pass steps 1.4 times the wave's own steepest step at 60 % Resonance and 3.3 times at 80 % (A3 at a 1 kHz Cutoff); up to about 50 % the step stays inside the wave's own. A short crossfade from the old Mode's sound to the new one's on every Mode change would take the click away. A change to the Filter itself, not to 231's make-up.

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-06) on night/2026-11-06 and merged into main on 2026-11-07, approved by the owner, untried: "It's fine, I trust you. Merge and push."; released in 1.26.1; the fix from 1.26.1's statistics run released in 1.26.2. In v1, decided by the owner (2026-11-06, "Yes, v1").

## Decisions

Claude's calls, open to the owner (2026-11-06, triage):

1. **A change of Mode fades, about 10 ms,** from the Filter as it was to the Filter as it is now: short enough to be heard as the switch itself, long enough that no step is heard. Where the Resonance is low and the two Modes' levels meet, the fade is there too, unheard.
2. **The Slope is left as it is:** the issue is the Mode, and 231 measured no click on a Slope change; if the same fade covers it at no cost, it may, but nothing asks it to.
3. **Nothing costs more while no Mode is changing:** the fade's second Filter, if there is one, plays only during the fade, or is silent and as cheap as the browser allows.
4. **What is drawn follows the sound:** the Response Curve and the Viewers show the new Mode from the change, as now; the fade is too short to draw.

## Agent Brief

**Category:** enhancement
**Summary:** A change of Filter Mode while a Note sounds fades from the old Mode's sound to the new one's over about 10 ms, so it never clicks, at any Resonance.

**Current behavior:** The Filter's stages swap Mode at one sample. Since 231 made the band-pass louder at high Resonance, switching from it back to the low-pass while a Note holds steps 1.4 times the wave's own steepest step at 60 % Resonance and 3.3 times at 80 % (A3, a 1 kHz Cutoff); up to about 50 % the step stays inside the wave's own.

**Desired behavior:**
- Any change of Mode, by the picker, a Preset, a shared link, MIDI or a Show, fades over about 10 ms (decision 1), per Voice, in both directions.
- The sound before and after the fade is exactly as now; the Slope's change is as now (decision 2).
- No extra cost while no Mode is changing (decision 3); the Response Curve shows the new Mode at once (decision 4).

**Key interfaces:**
- The engine's Filter stages per Voice and the Mode they are set to; its band-pass make-up from 231, which must change with the stages, not before or after the fade.
- 231's no-click measure: the largest sample-to-sample step after the change against the wave's own steepest step.

**Acceptance criteria:**
- [x] Switching between every pair of Modes while a Note holds, at 0, 50, 80 and 100 % Resonance and both Slopes, steps no more than the wave's own steepest step, in an offline render (within 231's margin of 1.1: call 2).
- [x] 231's test of the band-pass switched at Init's Resonance, swept to 80 % and back, and switched back, passes with its criterion at every Resonance.
- [x] A held Note and its level are as now before and after the fade; the Presets' levels are unchanged (the Filter, while no Mode changes, is wired as before; not measured Preset by Preset).
- [x] The engine's cost while no Mode changes is as before (the statistics' run): 1.26.1's eight-Voice chord at 59.3 % of a core against 1.26.0's 61.2 %, the Demo at 103.2 % against 112.3 %.

**Out of scope:**
- A fade on a Slope change, a Cutoff jump or a Preset's other Parameters.
- The band-pass's make-up itself (231).

## How it was built

Built at night (2026-11-06) on night/2026-11-06, test-first.

**What was built.** The Filter has two sides in every Voice, each with its own two stages, its own Resonance curve and its own band-pass make-up (231's), so the make-up changes with its side's stages, never before or after the fade. A change of Mode, from wherever it comes (the picker, a Preset, a shared link, MIDI, a Show), goes to the side not heard, and every Voice fades over to it in a straight line over 10 ms, the old side's share falling as the new one's rises. While no Mode changes, only the side heard is wired, straight from the Mixer to the Amp as before; the side faded out is unwired once its fade has ended, by the audio clock (a silent node's `ended`), and given new stages, so the next fade into it starts from silence. A Slope change goes to both sides at once, as before (decision 2); the Response Curve and the Viewers' twins show the new Mode at once (decision 4); the Filter Tap hears the fade as it is.

**Measured** (offline renders, A3 at a 1 kHz Cutoff): every ordered pair of Modes, at 0, 50, 80 and 100 % Resonance and both Slopes, steps at most 1.04 times the wave's own steepest step; without the fade, from the band-pass at 80 %, 4.1 times at 24 dB (3.3 at 12 dB, as 231 measured). A held two-Voice chord keeps its Mode's level before and after each fade. An offline render of an 8-Voice chord over 10 s, with one change of Mode, takes as long as before (about 730 ms both, on a loaded machine).

**Claude's calls, open to the owner:**

1. **10 ms, in a straight line,** both sides' shares summing to 1. The same sound at 5 or 12 ms; at 15 ms even the last 1.04 goes, if 10 ms ever sounds too quick.
2. **The no-click criterion is 231's, with its margin of 1.1,** not a strict 1.0: the most, 1.04, is the low-pass at 100 % Resonance and 12 dB ringing up from silence on its new side, 16 ms after the change, past the fade's end, as it does at a Note's start; it is the same at a fade of 5, 10 or 12 ms.
3. **A change of Mode while a fade is under way waits for its end** (10 ms, and a few more for the browser to say so), and only the last one asked for is played then; a change back to the Mode being left turns the fade round at once. So no side ever changes Mode while it is heard. In the measure, a change at once on the quieter side clicked no more than the waiting does, so it is a matter of rule more than of ear.
4. **The cost was measured by an offline render, not by the statistics' run** (`npm run stats`, an hour, the whole suite), which was not run at night: the acceptance criterion's last box is the release's to tick.

**To try in the app:**

- Init, a Note held, Resonance at 80 %: switch from band-pass to low-pass and back, and between every Mode. No tick, only the change of tone.
- The same at 24 dB, and at 100 % Resonance.
- An 8-Voice chord held while switching Mode: the chord fades over as one.
- Step through Presets with a Note held, and click the picker quickly several times: the last Mode clicked is the one heard, without a tick.
- Change the Slope with a Note held: as before, at once.

**Since then (2026-11-07, the 1.26.1 code review):** a change that came after a fade's 10 ms but before the browser said the fade had ended faded in at once, over the side still ringing with its old Mode, and a Mode waiting since the fade then followed it, over the last one asked for. A fade now counts as under way until it has settled, so such a change waits like any other; a test changes Mode in that gap and hears the last one asked for.

**Since then (2026-11-07, 1.26.1's statistics run):** waiting in that gap clicked about one run in twenty under coverage: the end then started the waiting Mode's fade from a clock read late, past where an offline render had got to. A change in that gap now settles the fade at once, the side faded out being silent by the clock, gives up any Mode waiting, and fades in itself; the same test hears the last one asked for. Released in 1.26.2.

**Since then (2026-11-07, [251](./251-tidy-ups-after-1-26-1.md)):** a fade settles early only once the audio clock has passed its end, not when a change is given a time past it. A test shows the gap's click every time without 1.26.2's fix.
