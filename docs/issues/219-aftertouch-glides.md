# 219: Aftertouch glides

**What to build:** Part (c) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 9's finding on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that aftertouch re-sets every parameter of all 8 Voices unsmoothed, so it steps and zippers, and on Resonance rebuilds a 4,097-point curve per message. The ear check asked the owner the same (inbox). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [218](./218-a-change-writes-only-what-it-changes.md), which settles how writes are gathered

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 183:

1. **Aftertouch is smoothed,** so pressure glides; its reach stays as issue 132 set it (Claude's call, open to the owner, 2026-11-02).
2. **Over the bend wheel's 4 ms,** decided by the owner ("Yes, 4 ms", 2026-11-03). Knobs turned from a Controller keep their immediate writes; if they step audibly, that is an issue of its own.

Claude's call, open to the owner (2026-11-02):

3. **The model and the sound smoothed alike** (ADR-0003): exact where the pressure maps linearly (Cutoff, Pitch, Osc 2's cents); for Resonance's Q the model and the sound may differ slightly while the 4 ms run, written in the issue.

## Agent Brief

**Category:** enhancement
**Summary:** Pressing harder on a held key moves its Destination in audible steps, and each message rewrites the whole sound.

**Current behavior:** Each aftertouch message re-applies the whole sound with immediate writes, only Pitch smoothed; Resonance rebuilds its curve on every message. With aftertouch on the Cutoff, inharmonic energy is −32 dB, against −76 dB smoothed.

**Desired behavior:**
- Aftertouch moves its Destination over 4 ms, as the bend wheel moves Pitch.
- A message writes only its Destination, not the whole sound.
- Resonance's curve is not rebuilt per message.
- The Viewers show the same glide (the Modulation model mirrors it).

**Key interfaces:**
- The engine's pressure handling
- The Modulation model, which must stay equal to the sound (ADR-0003)

**Acceptance criteria:**
- [ ] An engine test: aftertouch on the Cutoff and on the Resonance at 100 messages a second keeps inharmonic energy below −70 dB
- [ ] The Modulation model matches the sound in the engine tests, Resonance's small gap during the glide written
- [ ] The MIDI keyboard tests pass unchanged

**Out of scope:**
- How far aftertouch reaches (issue 132)
- A Controller's knobs' smoothing
