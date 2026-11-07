# 248: A crossfade on a change of Filter Mode

**What to build:** From [231](./231-a-band-pass-not-so-much-quieter.md)'s decision 8, decided by the owner (2026-11-06, "Yes to all four"): the Filter's stages swap Mode at one sample, so a change of Mode while a Note holds can click. Since 231 made the band-pass louder at high Resonance, switching from it back to the low-pass steps 1.4 times the wave's own steepest step at 60 % Resonance and 3.3 times at 80 % (A3 at a 1 kHz Cutoff); up to about 50 % the step stays inside the wave's own. A short crossfade from the old Mode's sound to the new one's on every Mode change would take the click away. A change to the Filter itself, not to 231's make-up.

**Blocked by:** none

**Status:** needs-triage · enhancement. In v1 or v2: the owner's (a click is polish, but the Filter's stages change shape for it).
