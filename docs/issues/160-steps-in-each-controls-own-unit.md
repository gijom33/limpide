# 160: Steps in each control's own unit

**What to build:** The owner's question (2026-10-31): "what is a good increment to move the faders and knobs with the arrow keys", grilled the same evening. Today an arrow key moves a knob or fader 2 % of its travel (Shift 0.2 %, Page Up and Down 10 %, Home and End to its ends), so on a log-scaled control a press lands on odd values (Cutoff 2.00 → 2.23 → 2.49 kHz; Attack 10 → 11.6 ms), a press after a drag never lands on a round value, and the wheel and a C16 knob each move by steps of their own. Polish of v1's controls ([131](./131-v1.md)).

**Blocked by:** none. Relative encoders and the C16's tuning live in the MIDI code that issues 112 and 147 changed on night/2026-10-31; build it on `main` once that night is merged (Claude's call, open to the owner).

**Status:** ready-for-agent · enhancement

## Decisions

Decided by the owner in a grilling, 2026-10-31 (Claude's recommendations, each accepted):

1. **Steps in each control's own unit:** an arrow press is a unit step (a semitone, a time step, 1 %, 0.5 dB), not 2 % of the travel. Stepped controls (Octave, Semitone, the choices) stay a whole step per press.
2. **Snapping to the grid:** after a drag leaves a value off the grid (2.07 kHz), the first press lands on the next grid value in that direction; every later press stays on it. ("Absolutely.")
3. **No acceleration:** a held arrow repeats at the system's rate with the same step; Page Up and Down, Home and End cover the coarse moves.
4. **The step written in the tip:** each knob's and fader's tip gains a line ("↑↓ a semitone · Shift 10 cents · Page an octave"), where there is a keyboard, not on a touch screen.
5. **In v1,** as polish of the controls.
6. **Absolute MIDI unchanged:** a knob sending 0–127 sets a position, 1/127 of the travel per step, with no grid and no snap.
7. **Grids near one MIDI step** where they can be (the Cutoff's MIDI step is 0.94 of a semitone, a percent control's 0.79 %), so the keyboard and a controller feel alike.
8. **CC 64 is exactly zero** on every control centred on zero (Detune, Osc 2's Env Amount, the Filter's Amount, any added later): 0–64 cover the lower half and 64–127 the upper.
9. **Ranges stay as they are,** round at their ends; a future control may be given a range that suits 128 steps where it costs nothing.
10. **Frequency and pitch:** the Cutoff and Osc 2's Env Amount a semitone a press, Shift 10 cents, Page an octave; Detune 1 cent, Shift 0.1, Page 10 cents; the Filter's Amount (shown in octaves) 0.1 octave, Shift 0.01, Page 1 octave.
11. **Times** (the Envelopes' Attack, Decay and Release, Glide): a round-number series of about 20 a decade (10, 11, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90 ms …); Page doubles or halves; Shift 1 %.
12. **Percent controls** (Sustain, Resonance, Depth, Pulse Width, Velocity, Key Track, Volume, and every other shown in %): 1 % a press, Shift 0.1 %, Page 10 %.
13. **The free LFO Rate:** the times' round series, in Hz; synced, it steps note values (issue 112).
14. **Relative encoders (the C16):** one grid step a tick, keeping the owner's tuning for fast turns (a fast 66 or 62 counts a third of a step).

Claude's calls, accepted by the owner with the summary ("It matches what I had in mind"):

15. **The Mixer's faders, shown in dB:** 0.5 dB a press, Shift 0.1 dB, Page 6 dB; below the lowest dB step, −∞.
16. **The wheel:** a notch is one grid step, a trackpad's small scrolls adding up to it, as Octave's wheel already does (issue 105).

## Agent Brief

**Category:** enhancement
**Summary:** Arrow keys, the wheel and relative encoders move every knob and fader by a step in its own unit, landing on round values, instead of a fixed share of its travel.

**Current behavior:** An arrow press moves a control 2 % of its travel (Shift 0.2 %, Page 10 %); on log-scaled controls the values reached are odd, and after a drag no press lands on a round value. The wheel moves by pixels of scroll; a relative encoder's tick moves 1 % of the travel; an absolute MIDI knob's CC 64 is 0.5039 of the travel, so a control centred on zero cannot be set to zero from MIDI.

**Desired behavior:** Each Parameter declares its grid (decisions 10 to 13 and 15): a unit step for an arrow press, a fine one for Shift, a coarse one for Page Up and Down. A press moves to the next grid value in its direction (from an off-grid value, the nearest one beyond it), so values are always round after a press. Home and End still go to the ends. A wheel notch and a relative encoder's tick move one grid step (a fast burst a third of one, as tuned for the C16); a trackpad's small scrolls add up to a notch. An absolute MIDI knob keeps setting a position, but on a control centred on zero CC 64 is exactly the centre. Each control's tip says its steps, where there is a keyboard. Stepped controls and choices move as now. Nothing stored in a Patch is rounded by this: only what a press, a notch or a tick sets lands on the grid.

**Key interfaces:**
- The Parameter definitions in the Patch (each gains its grid)
- The shared control behaviour for knobs and faders (keys, wheel)
- The control surface's relative and absolute CC handling, and its C16 tuning
- The tips; CONTEXT.md if a new word is needed for the grid

**Acceptance criteria:**
- [ ] Cutoff at 2.00 kHz: ↑ gives the next semitone (2.12 kHz), Shift ↑ 10 cents, Page Up 4.00 kHz
- [ ] After a drag to 2.07 kHz, ↑ lands on 2.12 kHz and ↓ on 2.00 kHz
- [ ] Attack at 10 ms: ↑ 11 ms, ↑ 12, ↑ 14; Page Up 20 ms
- [ ] Sustain at 70 %: ↑ 71 %, Shift ↑ 70.1 %, Page Up 80 %
- [ ] Osc 1's Mixer fader at 0.0 dB: ↓ −0.5 dB; at its lowest dB step, ↓ −∞
- [ ] Detune from MIDI CC 64 is exactly 0 cents; CC 0 and 127 its ends
- [ ] A C16 tick (65) moves one grid step; a fast 66 a third of one; a wheel notch one step
- [ ] Each knob's and fader's tip names its steps on a computer, not on a phone
- [ ] Unit tests for each grid and for snapping; the knob, fader, keyboard-access and MIDI specs updated; every test passes in Linux's fonts too

**Out of scope:**
- Any change to a Parameter's range
- Rounding stored values, Presets or what an absolute MIDI knob sets
