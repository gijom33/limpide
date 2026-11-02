# 183: Fewer writes for each change

**What to build:** Review 18's finding 2 and review 9's findings 1 and 2 on 1.21.1 ([18](../reviews/2026-11-02/18-performance-expert.md), [9](../reviews/2026-11-02/9-ts-react-webaudio.md)): each Demo knob tick rewrites the whole Patch (about 10,600 AudioParam calls a second); every MIDI message re-renders the whole page (1,250 aftertouch messages gave 1,063 React commits); aftertouch re-sets every parameter of all 8 Voices unsmoothed, steps and zippers (on Resonance it rebuilds a 4,097-point curve per message). The ear check asked the owner the same about aftertouch (inbox).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Aftertouch is smoothed** like a knob's own moves, so pressure glides; its reach stays as issue 132 set it.
2. **One write per parameter and frame** at most, and only of what changed.

## Agent Brief

**Category:** enhancement
**Summary:** A change to one control rewrites the whole sound, and a MIDI message re-renders the whole page; aftertouch steps audibly.

**Current behavior:** applyPatch writes every AudioParam of every Voice on each change; the Demo's 40 ms tick does so 25 times a second. useMidi keeps the Activity line as App state, so every MIDI message commits the whole tree. setPressure re-applies the whole sound with setValueAtTime, only Pitch smoothed; Resonance rebuilds its curve on each message. Inharmonic energy with aftertouch on the Cutoff: −32 dB, against −76 dB smoothed.

**Desired behavior:** A change writes only the parameters it changes, coalesced to one write per frame; the Demo's tick costs a fraction of today's calls. The MIDI Activity line updates without re-rendering App (its own small store, read where shown). Aftertouch moves its Destination with the same short smoothing as a knob turned from a Controller; Resonance's curve is not rebuilt per message.

**Key interfaces:**
- The engine's applyPatch and setPressure
- The Demo's knob tick
- useMidi's Activity line and the MIDI panel that shows it
- The Modulation model, which must stay equal to the sound (ADR-0003)

**Acceptance criteria:**
- [ ] An engine test: a Demo knob tick writes only the changed parameters
- [ ] An engine test: aftertouch on the Cutoff and the Resonance at 100 messages a second keeps inharmonic energy below −70 dB
- [ ] A test: a stream of MIDI messages does not re-render App
- [ ] The Modulation model still matches the sound in the engine tests; every test passes in Linux's fonts too

**Out of scope:**
- How far aftertouch reaches (issue 132)
- The Viewers' cost (issue 182)
