# 132: Aftertouch

**What to build:** From the v1 grilling ([131](./131-v1.md), decisions 5 and 9, decided by the owner 2026-10-31): "We should support aftertouch." Pressing harder on a held key moves one Destination, as a second mod wheel, as a plugin synth answers a keyboard's pressure. Today Limpide reads channel aftertouch from MIDI and throws it away. PRD story 98.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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
- [ ] A MIDI unit test: channel pressure reaches the app as a pressure from 0 to 1; per-Note pressure does not
- [ ] An engine test: full pressure on the Cutoff raises the Effective Cutoff by the reach the model predicts, and no pressure leaves it at the knob's
- [ ] An end-to-end test with a stand-in MIDI keyboard: pressure moves the Cutoff's ring; a different Destination picked in the MIDI panel moves that one instead; the choice survives a reload
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Per-Note pressure and MPE, out of scope (decided by the owner, 2026-10-31)
- More than one Destination at once, or a modulation matrix
- Aftertouch from the on-screen piano or the computer keyboard
