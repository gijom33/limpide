# 201: The Mixer steps in what it shows

**What to build:** The owner's answer (2026-11-02) to call 1 of [160](./160-steps-in-each-controls-own-unit.md), which made the Mixer's faders step in dB whatever they show, so outside the Synth Geek Layer a press from 100 % reads 94 %, 89 %, 84 %…: "Yeah, more logical to step in %age there. Just need the position of the fader to be the same regardless of the unit used." Polish of the controls for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-02) on night/2026-11-02, for the owner to try

## Decisions

Decided by the owner, 2026-11-02:

1. **Outside the Synth Geek Layer, a Mixer fader steps in %,** as it reads: 1 % a press, as every other percent control (160, decision 12). This replaces 160's call 1.
2. **Inside it, the fader steps in dB,** as it reads there (160, decision 15).
3. **The fader's position does not depend on the unit:** switching the Synth Geek Layer on or off moves no fader and changes no sound, only its readout and its steps.

Claude's calls, open to the owner:

4. **Shift and Page follow the unit shown:** outside the Synth Geek Layer Shift 0.1 %, Page 10 %; inside it as 160 set (Shift 0.1 dB, Page 6 dB, then −∞ below −40 dB).
5. **Ring steps in %** in both, as it always reads % (160's call 1 had it step in dB).
6. **The wheel, a Relative knob's tick and the tip's steps line** follow the same choice, so each says and does what the readout shows.
7. **An Absolute knob or fader is unchanged:** a position, 1/127 of the travel a step (160, decision 6).

## Agent Brief

**Category:** enhancement
**Summary:** A Mixer fader's arrow, wheel and Relative steps follow the unit it shows: % outside the Synth Geek Layer, dB inside it.

**Current behavior:** The Mixer's faders (the Oscillators, the Sub, the Noise, Ring) step on a dB Grid whatever they read. Outside the Synth Geek Layer they read %, so a press from 100 % reads 94 %, 89 %, 84 %, and a dozen presses near the bottom all read "1 %".

**Desired behavior:**
- Outside the Synth Geek Layer, ↑ and ↓ move a Mixer fader 1 % of what it reads, Shift 0.1 %, Page 10 %, landing on round percentages.
- Inside it, the dB Grid as now: 0.5 dB, Shift 0.1 dB, Page 6 dB, −∞ below −40 dB.
- Ring always reads % and always steps in %.
- Switching the Synth Geek Layer moves no fader, changes no sound, and keeps the value stored as it was; only the readout and the next press's Grid change. The next press after a switch lands on the new Grid, as after a drag.
- The wheel, a Relative knob's tick and the steps line in each fader's tip match the Grid in use.

**Key interfaces:**
- The Mixer Parameters' Grid, chosen by whether the Synth Geek Layer is on
- The Synth Geek Layer's setting
- The fader's tip (its steps line) and the glossary's Grid entry

**Acceptance criteria:**
- [x] Geek off: Osc 1's fader at 100 %, ↓ reads 99 %, Page ↓ 90 %, Shift ↓ 99.9 % (the sound moving accordingly)
- [x] Geek on: at 0.0 dB, ↓ reads −0.5 dB; at −40 dB, ↓ −∞ (as 160)
- [x] Switching Geek on and off with a fader at any value moves neither the fader nor the sound
- [x] Ring steps 1 % with Geek on and off
- [x] A wheel notch and a C16 tick step the same as a press, in both
- [x] The tip's steps line reads % outside the Synth Geek Layer and dB inside it
- [x] 160's other Grids unchanged

**Out of scope:**
- The Mixer reading dB outside the Synth Geek Layer
- The other controls' Grids (160)

## How it was built

- **Two Grids for a Mixer fader** (`src/patch/patch.ts`): a Parameter may declare a `geekGrid`, its Grid while the Synth Geek Layer is on. The Osc 1, Osc 2, Noise and Sub faders step on the percent Grid (1 %, Shift 0.1 %, Page 10 %) and carry 160's dB Grid as their `geekGrid`; Ring has the percent Grid alone. `inUnitShown(def, geek)` gives the Parameter with the Grid in use. Only the steps change with the layer, never the value: switching it moves no fader and changes no sound, and the next press lands on the new Grid, as after a drag.
- **Keys and wheel** (`src/ui/paramControl.tsx`): the arrows, Shift, Page and a wheel's notch step on the Grid of the layer's state.
- **MIDI** (`src/midi/controlSurface.ts`, `src/ui/hooks/useMidi.ts`): a Relative knob's click (a C16's thirds too) asks the surface whether the layer is on. An Absolute knob still sets a position.
- **The tips** (`src/ui/tips.ts`, `src/ui/Tooltip.tsx`): a fader's tip has a second steps line for the layer, shown while it is on.
- **Docs:** the glossary's Grid entry; a dated line in 160.
- **Tests:** the Grid's unit tests (% off, dB on, Ring in both, the other Grids alike on and off); the control surface's (a C16 click on Osc 1 and Ring, the layer off then on); the tips' (both steps lines, none for Ring in dB); in the browser, the keyboard-access spec (presses, Page and a wheel notch off and on, the layer switched twice with the fader and its value unmoved, Ring by the %), the tooltip spec (the steps line off and on), the MIDI Learn spec (a Relative click off and on, the switch moving nothing). The Tutorial spec's Bass Step now reaches 47 % by Page and presses. `npx tsc`, `npm run lint`, the unit tests of the files touched, and the keyboard-access, tooltip, MIDI Learn, Tutorial, knob, Synth Geek Layer and oscillator specs in Chromium and WebKit, all passing. Then the code review (standards and spec); its points fixed (160's dated line, a test's name, the wheel tested in the layer too).
- **Claude's calls, open to the owner:**
  1. Decisions 4 to 7 as written: Shift and Page follow the unit shown, Ring steps in % in both, the wheel, a Relative click and the tip follow the same choice, an Absolute knob unchanged.
  2. **Shift ↓ from 100 % stores 99.9 % but reads "100 %":** every percent readout shows whole percents, as every percent control's Shift has since 160. The criterion's 99.9 % is met in the value (and the sound), not in the readout; showing a tenth of a percent is a change for every percent control, left out.
  3. **Gathered thirds kept across a switch:** a C16's fast thirds gathered towards a step before the layer is switched count towards a step of the new Grid; a third is a third of whichever step.
  4. **Amp Sustain and Volume** also read dB in the Synth Geek Layer but still step 1 % there, as 160 set; out of this issue's scope ("the other controls' Grids"). The same choice for them would be a new issue, if the owner wants it.
- **To try:** on the Mixer tab with the Synth Geek Layer off, Osc 1 from 100 % with ↓, Page ↓ and the wheel (99 %, 90 %…); switch the layer on in Display and see the fader stay put while its readout turns to dB, then ↓ (the half-dB steps, −∞ below −40 dB); Ring by 1 % in both; a fader's tip in both; a C16 knob on Osc 1 in both.
