# 248: A crossfade on a change of Filter Mode

**What to build:** From [231](./231-a-band-pass-not-so-much-quieter.md)'s decision 8, decided by the owner (2026-11-06, "Yes to all four"): the Filter's stages swap Mode at one sample, so a change of Mode while a Note holds can click. Since 231 made the band-pass louder at high Resonance, switching from it back to the low-pass steps 1.4 times the wave's own steepest step at 60 % Resonance and 3.3 times at 80 % (A3 at a 1 kHz Cutoff); up to about 50 % the step stays inside the wave's own. A short crossfade from the old Mode's sound to the new one's on every Mode change would take the click away. A change to the Filter itself, not to 231's make-up.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1, decided by the owner (2026-11-06, "Yes, v1").

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
- [ ] Switching between every pair of Modes while a Note holds, at 0, 50, 80 and 100 % Resonance and both Slopes, steps no more than the wave's own steepest step, in an offline render.
- [ ] 231's test of the band-pass switched at Init's Resonance, swept to 80 % and back, and switched back, passes with its criterion at every Resonance.
- [ ] A held Note and its level are as now before and after the fade; the Presets' levels are unchanged.
- [ ] The engine's cost while no Mode changes is as before (the statistics' run).

**Out of scope:**
- A fade on a Slope change, a Cutoff jump or a Preset's other Parameters.
- The band-pass's make-up itself (231).
