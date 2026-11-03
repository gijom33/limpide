# 160: Steps in each control's own unit

**What to build:** The owner's question (2026-10-31): "what is a good increment to move the faders and knobs with the arrow keys", grilled the same evening. Today an arrow key moves a knob or fader 2 % of its travel (Shift 0.2 %, Page Up and Down 10 %, Home and End to its ends), so on a log-scaled control a press lands on odd values (Cutoff 2.00 → 2.23 → 2.49 kHz; Attack 10 → 11.6 ms), a press after a drag never lands on a round value, and the wheel and a C16 knob each move by steps of their own. Polish of v1's controls ([131](./131-v1.md)).

**Blocked by:** none. Relative encoders and the C16's tuning live in the MIDI code that issues 112 and 147 changed on night/2026-10-31; build it on `main` once that night is merged (Claude's call, open to the owner).

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "I trust you." Its Mixer steps went to [201](./201-the-mixer-steps-in-what-it-shows.md)

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
- [x] Cutoff at 2.00 kHz: ↑ gives the next semitone (2.12 kHz), Shift ↑ 10 cents, Page Up 4.00 kHz
- [x] After a drag to 2.07 kHz, ↑ lands on 2.12 kHz and ↓ on 2.00 kHz
- [x] Attack at 10 ms: ↑ 11 ms, ↑ 12, ↑ 14; Page Up 20 ms
- [x] Sustain at 70 %: ↑ 71 %, Shift ↑ 70.1 %, Page Up 80 % (70.1 % is the value set; the readout still shows whole percents: call 4)
- [x] Osc 1's Mixer fader at 0.0 dB: ↓ −0.5 dB; at its lowest dB step, ↓ −∞
- [x] Detune from MIDI CC 64 is exactly 0 cents; CC 0 and 127 its ends
- [x] A C16 tick (65) moves one grid step; a fast 66 a third of one; a wheel notch one step
- [x] Each knob's and fader's tip names its steps on a computer, not on a phone
- [ ] Unit tests for each grid and for snapping; the knob, fader, keyboard-access and MIDI specs updated; every test passes in Linux's fonts too (all but the last part: Linux's fonts are GitHub's run, after a push; the fader spec needed no change, the faders' steps are in the keyboard-access spec)

**Out of scope:**
- Any change to a Parameter's range
- Rounding stored values, Presets or what an absolute MIDI knob sets

## How it was built

- **The Grid** (`src/patch/grid.ts`, a new word in `CONTEXT.md`): each Parameter in `src/patch/patch.ts` declares one, its unit, fine (Shift) and coarse (Page) steps and their words. A press goes to the next value of its size beyond the one it starts from, so a dragged value lands on the grid at once and stays on it; the range's ends are always reached. The kinds: even steps (every percent control 1 %, 0.1 %, 10 %; Detune 1, 0.1, 10 cents; the Filter's Amount 0.1, 0.01, 1 octave; Osc 2's Env Amount a semitone, 10 cents, an octave); pitch (the Cutoff: semitones, 10 cents and octaves counted from 1 kHz); the round series of 20 a decade (10, 11, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90) for the Envelopes' times, Glide and the free LFO Rate, Page doubling or halving to the nearest of the series, Shift 1 % to three figures; dB for the Mixer's five faders (0.5, 0.1, 6 dB, down to −40 dB, then −∞). Stepped controls (Octave, Semitone, a synced Rate's note values) move a whole step, Page 2 as before. Nothing stored is rounded.
- **Keys and wheel** (`src/ui/paramControl.tsx`): the arrows, Shift and Page step on the Grid, Home and End go to the ends; presses quicker than renders (a held key) each go on from the last. A wheel notch (90 px of scroll, a trackpad's small scrolls adding up) is a step, Shift a fine one.
- **MIDI** (`src/midi/controlSurface.ts`): a Relative tick is a step of the Grid; a C16's fast 66 or 62 a third of one, gathered into whole steps, a turn back forgetting the thirds so it answers at once. An Absolute knob still sets a position, but on a control centred on zero (Detune, Osc 2's Env Amount, the Filter's Amount, and the Semitone and Octaves, whose zero was already at 64 after rounding) 0 to 64 is the lower half and 64 to 127 the upper, so CC 64 is exactly zero.
- **The tips** (`src/ui/tips.ts`, `src/ui/Tooltip.tsx`): each knob's and fader's tip ends with its steps ("↑↓ a semitone · Shift 10 cents · Page an octave"), written from its Grid, so they cannot drift apart; hidden on a screen without hover (a phone).
- **Found on the way:** issue 176's Synth Geek Layer sizers were kept with the layer off (its context holds null, not undefined), which the smoke spec caught; fixed in its own commit, with a line in 176. Issues 51, 53 and 145 get dated lines for the new steps.
- **Tests:** `src/patch/grid.test.ts` (every Grid, snapping from a drag, the ends, −∞); the control surface's tests (a tick a step, the C16's thirds, a turn back, CC 64 on Detune and the Amount, thirds kept apart when Sync switches); the tips' unit test (every Parameter's steps line); in the browser, the keyboard-access spec (the Cutoff, Attack and Sustain criteria; the Mixer in dB down to −∞ and back), the knob spec (a notch a step, a trackpad's scrolls adding up; the width sweep by Page), the tooltip and touch-tip specs (the line on a computer, none on a phone), the MIDI Learn spec (ten ticks, ten semitones). Specs that counted 2 % presses (LFO, Maths, Tutorial, Tour, Envelopes, pitch marker) now press Page or count the new steps.
- **Tests run:** `npx tsc`, `npm run lint`; `npx vitest run` 1311 of 1314, the three others (cycle lock, readout box, edge Patches) timing out at 5 s under the full run's load and passing alone; all 574 Chromium specs (12 timed out while unit tests ran beside them, all passing on their rerun); in WebKit the knob, fader, keyboard-access, MIDI Learn, Quick Setup, C16 card, LFO, tooltip, Maths, Envelopes, smoke, Tour, pitch marker and Tutorial specs, all passing but issue 176's synced Rate test, which times out under the parallel load and passes alone (7.9 s). Then the code review (standards and spec): its bug (a C16's thirds on the free Rate jumping the note value once Sync is on) fixed with a test, and its smaller points.
- **Claude's calls, open to the owner:**
  1. **The Mixer's faders step in dB whatever they show.** They read % unless the Synth Geek Layer is on, so outside it a press from 100 % reads 94 %, 89 %, 84 %…, and the dozen steps from −40 to −34 dB all read "1 %". Ring steps in dB too, as a Mixer fader, though the Synth Geek Layer does not show it in dB. The other way would be 1 % steps outside the Synth Geek Layer and dB inside it, or the Mixer reading dB always.
     **Since then (2026-11-02, issue [201](./201-the-mixer-steps-in-what-it-shows.md)):** answered by the owner, the Mixer's faders step in % outside the Synth Geek Layer and in dB inside it, the fader's position the same in both.
  2. **The lowest dB step is −40 dB** (1 %, about one MIDI step up a fader's travel, decision 7): Page from 0 dB goes −6, −12 … −36, −40, then −∞.
  3. **The Cutoff's semitones count from 1 kHz,** so 500 Hz, 2 kHz and 4 kHz are on every size; 20 Hz and 20 kHz stay its ends, reached but off the grid (the first semitone up from 20 Hz is 20.9 Hz).
  4. **Readouts keep their precision:** a Shift step finer than the readout (Sustain's 70.1 %, Detune's 0.1 ¢, the Env Amount's 10 cents, the Amount's 0.01 octave) moves the sound and the knob but reads the same until enough add up, as Shift did before; showing a decimal would widen the knobs that issue 176 just settled.
  5. **Page has its own grid on even steps, pitch and dB** (from 73 % Page Up is 80 %, from 2.12 kHz 4 kHz, from −0.5 dB −6 dB); **on the series it doubles or halves** to the nearest of it (from 300 ms, 630 ms).
  6. **Shift on a time is 1 % to three figures** (10.0, 10.1, 10.2 ms): not the round series, which the arrows keep.
  7. **A trackpad turns slower than before:** 90 px of scroll a step (a Cutoff semitone) where it was 4 % of the travel per 100 px.
  8. The steps line hides where the screen has no hover (`hover: none`), so a touch laptop with a mouse shows it.
- **To try:** the Cutoff with ↑, Shift ↑ and Page Up from 2 kHz, then a drag and a press; an Attack from 10 ms; Sustain; the Mixer faders with the Synth Geek Layer on and off (call 1); the wheel and a trackpad over a knob; a C16 knob slow and fast on the Cutoff and an Envelope stage; an Absolute knob or fader on Detune at the middle; a tip on a computer.

