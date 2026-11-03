# 132: Aftertouch

**What to build:** From the v1 grilling ([131](./131-v1.md), decisions 5 and 9, decided by the owner 2026-10-31): "We should support aftertouch." Pressing harder on a held key moves one Destination, as a second mod wheel, as a plugin synth answers a keyboard's pressure. Today Limpide reads channel aftertouch from MIDI and throws it away. PRD story 98.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "It works."

## Agent Brief

**Category:** enhancement
**Summary:** Channel aftertouch from a MIDI keyboard moves one Destination, the Cutoff by default, chosen in the MIDI panel, its move drawn on the Destination's modulation ring.

**Current behavior:** channel pressure (and per-Note pressure) messages are parsed and ignored; nothing on the page or in the sound answers them.

**Desired behavior:**
- Channel aftertouch (one pressure for the whole keyboard, 0 to 127) moves one Destination, from none at no pressure to its full reach at full pressure. Per-Note (polyphonic) pressure stays ignored.
  **Since then (2026-11-01, the owner's decision 1 below):** polyphonic (per-Note) pressure is read too; the highest among the Notes held moves the one Destination, as channel pressure does. Per-Voice pressure and MPE stay for v2.
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
  **Since then (2026-11-01, the owner's decision 1 below):** per-Note pressure reaches the app too, as a pressure from 0 to 1 on its Note, and the control surface's tests check that the highest held Note's is the pressure, a released Note's forgotten, channel and per-Note feeding the same one. True, the new way.
- [x] An engine test: full pressure on the Cutoff raises the Effective Cutoff by the reach the model predicts, and no pressure leaves it at the knob's
- [x] An end-to-end test with a stand-in MIDI keyboard: pressure moves the Cutoff's ring; a different Destination picked in the MIDI panel moves that one instead; the choice survives a reload
- [x] Every test passes in Linux's fonts too

**Out of scope:**
- Per-Note pressure and MPE, out of scope (decided by the owner, 2026-10-31)
  **Since then (2026-11-01, the owner's decision 1 below):** polyphonic (per-Note) pressure is read too; the highest among the Notes held moves the one Destination, as channel pressure does. Per-Voice pressure and MPE stay for v2.
- More than one Destination at once, or a modulation matrix
- Aftertouch from the on-screen piano or the computer keyboard

## How it was built

Built on night/2026-11-01, test-first.

- **Reading it:** the MIDI parser reads channel pressure as a pressure from 0 to 1 and still drops per-Note pressure (`src/midi/parser.ts`). The control surface hands it to the page and never to MIDI Learn. The Activity Monitor shows "ch 1 · Aftertouch · 100 %".
  **Since then (2026-11-01, the follow-up below):** per-Note pressure is read too.
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

### The follow-up: polyphonic aftertouch (2026-11-01, the owner's decision 1)

Built on night/2026-11-01, test-first, after the channel aftertouch above.

- **Reading it:** the parser reads per-Note pressure (0xA0) as the same pressure message, from 0 to 1, naming its Note. The Activity Monitor names the Note too: "ch 10 · Aftertouch C2 · 100 %".
- **One pressure:** the control surface keeps the channel's pressure and each held Note's, by channel and Note, and hands the page the highest of them, so channel and per-Note feed the same pressure. A Note's release forgets its pressure, and the page is told the new highest if that changes it; a released Note's pressure is forgotten even when the Note is mapped to an Action. It still moves the one chosen Destination for every Note, and MIDI Learn never learns it. Nothing past the control surface changed: the Modulation model, the engine, the rings and the Timeline take the one pressure as before.
- **The record:** the MIDI panel's tip no longer says per-key pressure is not used; CONTEXT.md's Aftertouch, the PRD's two lines on it and issue 131's decision 9 (a Since then line) say per-Note pressure counts.
- **Tests:** the parser's (per-Note pressure on its Note, with running status), the control surface's (the highest held Note's, a release forgetting it, a Note known by its channel too, channel and per-Note together, never learned) and `useMidi`'s (the host told, the Activity Monitor's line). `e2e/midiKeyboard.spec.ts`: with two Notes held, the Cutoff's dot follows the one pressed harder, goes back to the other's when it is released, and hides when both are; it runs in Chromium.

Claude's calls, open to the owner:

1. **Channel and per-Note together:** the pressure is the higher of the channel's last pressure and the hardest-pressed held Note's. A keyboard usually sends one kind or the other, so this matters only for one that sends both.
2. **The channel's pressure is not forgotten on a release:** it has no Note, so it stays until the keyboard sends another, as before. A Note's pressure is kept until that Note's release, even a Note whose Note-on the page never heard.
3. **A Note is known by its channel and its number,** so the same Note on two channels is two pads.
4. **The Activity Monitor's line** names the Note after "Aftertouch", as "Note C4" does for a Note.

To try in the app:

- **The TempoPAD C16:** hold a pad and press harder: the sound brightens, the Cutoff's dot climbs, and the MIDI panel's Last message reads "Aftertouch" with the pad's Note. Hold two pads, press one hard and the other lightly: the dot follows the harder one; let it go and the dot falls back to the lighter one's pressure; let both go and the dot hides.
- **Another Destination** picked in the MIDI panel moves the same way for the pads.
- **A keyboard with channel aftertouch** behaves as before.

## Decisions (the owner, 2026-11-01)

1. **Polyphonic aftertouch, the highest pad,** decided by the owner (about 19:45: "Highest pad, tonight", having noted that the TempoPAD C16 sends polyphonic aftertouch). The MIDI parser also reads per-Note pressure (0xA0). The pressure used is the highest among the Notes held, a Note's pressure forgotten when it is released, and it moves the one chosen Destination for every Note, as channel pressure does. Channel and per-Note pressure feed the same pressure. Per-Voice pressure and MPE stay for v2. This reverses the out-of-scope line of 2026-10-31.
