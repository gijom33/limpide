# 108: Preset claims and levels

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 13 and 14, [fact-checker](../reviews/2026-10-30/13-fact-checker.md), [ear stand-in](../reviews/2026-10-30/14-ear-stand-in.md)), both measured by rendering through the engine offline:

- **False claims:** Zap Pluck does the reverse of its words (a restarted falling saw LFO starts mid-ramp, so each Note starts at FM 50 %, is a pure sine at 1/6 s, then jumps to full FM in its tail). Kalimba's sidebands sit on the odd Harmonics, not every fourth, and its "tine, then a round tone" never happens. Tine Piano's "a hard one barks" and FM Bell's "bright, then mellow" are inaudible (their Filters sit above every partial). FM Sidebands' "either side of the Harmonic" folds onto the Harmonics; the Osc 1 Octave tip's "each cycle takes twice as long" doesn't show on the Scope (Cycle Lock), its body gets the gap between the Oscillators wrong, and the FM tip's "hundreds of times a second" is tens on low Notes. Nine in all, in review 13's report.
- **Level jumps:** Clang, Zap Tom and Gong play 7 to 8 dB over the other Drums (Zap Tom 15 dB over Tom); Robot 12 dB under its group (18 dB on C2); Ring Lead, Ring Sweep and Breathing Bell about 6.5 dB under theirs.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** Every Preset and tip review 13 found false says what it does, and no Preset jumps more than a few dB from its group when stepping through the list.

**Current behavior:** as listed above, each measured in reviews 13 and 14.

**Desired behavior:**
- **Each false claim** is made true: change the sound where the words describe the better sound (Zap Pluck starting at full FM and melting to a sine; Kalimba's tine fading to a round tone; Tine Piano barking when hit hard; FM Bell mellowing), or change the words where the sound is the point. The choice per Preset is the agent's, written in this issue's notes.
- **Levels:** each Preset's loudest 100 ms on C4 sits within 3 dB of its group's median (the ear stand-in's measure), unless its words say it is meant to stand out; Breathing Bell's four Voices are allowed for.
- Nothing reaches the limiter that did not before.

**Key interfaces:**
- The Preset list, its descriptions, and the tips review 13 names

**Acceptance criteria:**
- [ ] Each of review 13's nine false claims, rendered again, is true
- [ ] A test (or a recorded offline render) lists each changed Preset's level against its group, all within 3 dB
- [ ] Each changed Preset still has a Tutorial or Demo part that uses it working, where it has one
- [ ] The owner listens to the changed Presets before the release

**Out of scope:**
- FM's and Ring's fold-back at the top and FM's DC offset ([103](./103-fm-and-ring-fold-back-at-the-top.md))
- The older Presets that drive the limiter (Stutter, Laser, Growl and others): not new, left in review 14's report
