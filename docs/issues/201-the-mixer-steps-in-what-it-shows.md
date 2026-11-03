# 201: The Mixer steps in what it shows

**What to build:** The owner's answer (2026-11-02) to call 1 of [160](./160-steps-in-each-controls-own-unit.md), which made the Mixer's faders step in dB whatever they show, so outside the Synth Geek Layer a press from 100 % reads 94 %, 89 %, 84 %…: "Yeah, more logical to step in %age there. Just need the position of the fader to be the same regardless of the unit used." Polish of the controls for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

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
- [ ] Geek off: Osc 1's fader at 100 %, ↓ reads 99 %, Page ↓ 90 %, Shift ↓ 99.9 % (the sound moving accordingly)
- [ ] Geek on: at 0.0 dB, ↓ reads −0.5 dB; at −40 dB, ↓ −∞ (as 160)
- [ ] Switching Geek on and off with a fader at any value moves neither the fader nor the sound
- [ ] Ring steps 1 % with Geek on and off
- [ ] A wheel notch and a C16 tick step the same as a press, in both
- [ ] The tip's steps line reads % outside the Synth Geek Layer and dB inside it
- [ ] 160's other Grids unchanged

**Out of scope:**
- The Mixer reading dB outside the Synth Geek Layer
- The other controls' Grids (160)
