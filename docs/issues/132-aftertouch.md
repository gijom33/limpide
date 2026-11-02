# 132: Aftertouch

**What to build:** From the v1 grilling ([131](./131-v1.md), decisions 5 and 9, decided by the owner 2026-10-31): "We should support aftertouch." Pressing harder on a held key moves one Destination, as a second mod wheel, as a plugin synth answers a keyboard's pressure. Today Limpide reads channel aftertouch from MIDI and throws it away. PRD story 98.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try

## Agent Brief

**Category:** enhancement
**Summary:** Channel aftertouch from a MIDI keyboard moves one Destination, the Cutoff by default, chosen in the MIDI panel, its move drawn on the Destination's modulation ring.

**Current behavior:** channel pressure (and per-Note pressure) messages are parsed and ignored; nothing on the page or in the sound answers them.

**Desired behavior:**
- Channel aftertouch (one pressure for the whole keyboard, 0 to 127) moves one Destination, from none at no pressure to its full reach at full pressure. Per-Note (polyphonic) pressure stays ignored.
- The Destination is chosen in the MIDI panel, from the LFOs' Destinations; the Cutoff by default, so pressing harder brightens the sound. The mod wheel keeps what it does today.
- Its reach at full pressure follows the Destination's law in the Modulation model, as an LFO's Depth does; for the Cutoff, up to two octaves up (Claude's call, open to the owner).
- Its move adds to the knob's value and to any LFO's, and shows where an LFO's does: the Destination's modulation ring, the Envelope Timeline's line for it, and the Effective Cutoff. The Modulation model mirrors it, so the Viewers and the sound agree (ADR-0003).
- The choice is remembered with the MIDI settings, as the bend range is, not in the Patch (Claude's call, open to the owner). The Activity Monitor shows the pressure as it comes.
- A tip in the MIDI panel says what it does and that not every keyboard sends it.

**Key interfaces:**
- The MIDI parser and the MIDI panel's settings
- The Modulation model's Destinations and their laws; the engine's modulation inputs
- The modulation rings and the Envelope Timeline

**Acceptance criteria:**
- [x] A MIDI unit test: channel pressure reaches the app as a pressure from 0 to 1; per-Note pressure does not
- [x] An engine test: full pressure on the Cutoff raises the Effective Cutoff by the reach the model predicts, and no pressure leaves it at the knob's
- [x] An end-to-end test with a stand-in MIDI keyboard: pressure moves the Cutoff's ring; a different Destination picked in the MIDI panel moves that one instead; the choice survives a reload
- [x] Every test passes in Linux's fonts too

**Out of scope:**
- Per-Note pressure and MPE, out of scope (decided by the owner, 2026-10-31)
- More than one Destination at once, or a modulation matrix
- Aftertouch from the on-screen piano or the computer keyboard

## How it was built

Built on night/2026-11-01, test-first.

- **Reading it:** the MIDI parser reads channel pressure as a pressure from 0 to 1 and still drops per-Note pressure (`src/midi/parser.ts`). The control surface hands it to the page and never to MIDI Learn. The Activity Monitor shows "ch 1 · Aftertouch · 100 %".
- **The model:** `pressed(patch, pressure)` in `src/modulation/modulationModel.ts` raises the chosen Destination by its law's `perDepth` times the pressure: one LFO's full swing at full pressure, nothing at none. The Modulation model carries the pressure (`Modulation.pressure`), so the dot on a knob's ring, the Timeline's lines, the Effective Cutoff and the Response Curve all follow it (ADR-0003).
- **The engine:** it plays the pressed Patch (`setPressure`) and keeps the pressure's history for the Timeline's past. The Patch in force stays the knobs' own. Pitch goes through the bend node.
- **The page:** an Aftertouch list in the MIDI panel, under Bend, holds the LFOs' Destinations grouped by stage. It is remembered as `limpide.aftertouch` beside the bend range, not in the Patch. Its tip says what it does and that not every keyboard sends it.
- **The Timeline:** from a keyboard's first pressure in a visit on, the Timeline draws the line and key entry of the Destination it moves.
- **Tests:** the parser, control surface, `useMidi`, Modulation model, Destinations and Timeline key unit tests. An engine test checks that the Effective Cutoff (none, then full pressure) and the Resonance (half pressure) match the model, and that the Filter's sound matches the Response Curve; another checks Pitch, the model and Cycle Lock. The end-to-end test in `e2e/midiKeyboard.spec.ts` uses a stand-in keyboard: pressure moves the Cutoff's dot, Resonance picked in the panel moves that one instead, and the choice survives a reload. It runs in Chromium and WebKit.

### Claude's calls, open to the owner

1. **How far each Destination goes.** Every Destination moves *up*, as far as one LFO at full Depth swings it one way:
   - **Cutoff:** two octaves (the issue's call).
   - **Pitch:** a semitone.
   - **Osc 2 Pitch:** an octave.
   - **Detune:** 50 cents. Like Osc 2 Pitch, it goes past the knob's end as an LFO does.
   - **Pulse Width:** 40 points.
   - **FM and Resonance:** their whole range.
   - **Volume:** half its range.

   A knob whose law has a room (Pulse Width, FM, Resonance, Volume) stops at its top. So on Volume, pressing only makes the sound louder, up to the knob's top, and does nothing at full Volume, which is Init's. Making Volume quieter as you press harder seemed backwards.
2. **On the ring, only the dot moves.** Aftertouch has no arc of its own: the blue ring stays the LFOs' alone. The dot shows while the pressure moves the knob, even on a knob nothing else moves. It can go past the LFOs' ring.
3. **The Timeline line.** It appears with a keyboard's first pressure in a visit and stays until the page reloads, so a keyboard that never sends aftertouch never adds a line. A Destination that only aftertouch moves gets LFO 1's short dashes. Its key entry's tip says aftertouch raises it.
4. **Changing the Destination** starts the new one at no pressure, until the keyboard sends its next pressure. The old one goes back to its knob at once.
5. **The list is the browser's own `<select>`.** It is the page's only one, and it is grouped by stage like the LFOs' Destination menu. The ‹ › picker belongs to the LFOs and to MIDI Learn.
6. **No smoothing.** Each pressure message applies the pressed Patch at once, as a knob turned from a Controller does. Pitch is the exception: it rides the bend wheel's few milliseconds of smoothing. At high Resonance the Cutoff could step audibly, which is worth listening for.

### To try in the app

- **A keyboard that sends aftertouch:** hold a Note and press harder. The sound brightens, the Cutoff's dot climbs, the LFO & Envelopes section draws the Cutoff's dotted line, and the MIDI panel's Last message reads "Aftertouch".
- **Another Destination:** pick Resonance, or Pulse Width on a pulse wave, in the MIDI panel, then press again. Reload the page: the choice is kept.
- **A keyboard without aftertouch:** nothing changes.

