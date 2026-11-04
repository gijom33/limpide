# 219: Aftertouch glides

**What to build:** Part (c) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 9's finding on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that aftertouch re-sets every parameter of all 8 Voices unsmoothed, so it steps and zippers, and on Resonance rebuilds a 4,097-point curve per message. The ear check asked the owner the same (inbox). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [218](./218-a-change-writes-only-what-it-changes.md), which settles how writes are gathered

**Status:** ready-for-agent · enhancement. Polish for v1; the owner answered question 1 on 2026-11-04 (decision 5)

## Decisions

From 183:

1. **Aftertouch is smoothed,** so pressure glides; its reach stays as issue 132 set it (Claude's call, open to the owner, 2026-11-02).
2. **Over the bend wheel's 4 ms** (superseded for aftertouch by decision 5), decided by the owner ("Yes, 4 ms", 2026-11-03). Knobs turned from a Controller keep their immediate writes; if they step audibly, that is an issue of its own.

Claude's call, open to the owner (2026-11-02):

3. **The model and the sound smoothed alike** (ADR-0003): exact where the pressure maps linearly (Cutoff, Pitch, Osc 2's cents); for Resonance's Q the model and the sound may differ slightly while the 4 ms run, written in the issue.

Decided by the owner, 2026-11-03 ([191](./191-the-owners-calls-after-1-21.md), question 13):

4. **On the Resonance, aftertouch reaches half the knob's range** ("Half the range"), so full pressure on Wobble does not self-oscillate past the limiter's knee.

Decided by the owner, 2026-11-04, answering question 1 below (relayed to the night by the owner's day session):

5. **Aftertouch alone glides with a 16 ms time constant; the bend wheel keeps its 4 ms** ("b should be fine"). The first criterion becomes: inharmonic energy under −60 dB for a keyboard's 7-bit stream and under −70 dB for an unquantised one, on the Cutoff and on the Resonance, the test at Resonance 0.2.

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
- [ ] Full pressure on the Resonance reaches half its knob's range; Wobble at full pressure stays under the limiter's knee (an engine test)
- [ ] The MIDI keyboard tests pass unchanged

**Out of scope:**
- How far aftertouch reaches (issue 132), but for the Resonance's half (decision 4)
- A Controller's knobs' smoothing

## Questions for the owner

The night of 2026-11-03: its builder wrote the first test (aftertouch on the Cutoff and the Resonance, 100 messages a second, inharmonic energy under −70 dB) and the first slice (every write a pressure message makes glides with `setTargetAtTime`, the bend wheel's way), then stopped: decision 2's 4 ms and the first acceptance criterion cannot both hold. The code was set back; nothing of it is committed.

**What was measured.** One Voice, a saw on A2 (110 Hz), Cutoff 500 Hz, Resonance 0.2. The pressure goes from none to full over 2 s, a message every 10 ms. The figure is everything between the Harmonics against the Harmonics, over the last 1.4 s, in the real engine offline in Chromium (`betweenHarmonicsDb`). With no pressure it is −92 dB.

| Glide's time constant | Cutoff, 7-bit (a keyboard's 127 steps) | Cutoff, unquantised | Resonance, 7-bit | Volume, 7-bit |
|---|---|---|---|---|
| none (today) | −52.5 dB | −57.5 dB | −51.3 dB | −55.2 dB |
| 4 ms (decision 2) | −55.8 dB | −67.8 dB | −54.5 dB | −58.7 dB |
| 8 ms | −58.7 dB | −73.2 dB | −57.7 dB | −61.6 dB |
| 16 ms | −62.5 dB | −78.7 dB | −61.8 dB | −65.4 dB |
| 32 ms | −67.3 dB | −83.4 dB | −66.5 dB | −70.1 dB |
| 64 ms | −72.8 dB | −86.4 dB | −71.7 dB | −75.6 dB |

- A keyboard's pressure comes in 127 steps, one every 16 ms on this press. A 4 ms glide finishes each step long before the next one, so the steps are still there, only rounded: 3 dB better than today.
- Review 9's −76 dB was not a glide: it was 4,000 unquantised steps, nearly smooth. The criterion's −70 dB came from that figure.
- At Resonance 0.7 (review 9's Cutoff case) this measure reads about −40 dB even for a near-smooth sweep: the Filter's peak sweeping through the Harmonics spreads them. So the test sits at Resonance 0.2. This is Claude's call, open to the owner.

1. **How long aftertouch glides, and what the test asks.** Today, 4 ms takes a real keyboard's stream from −52 to −56 dB; −70 dB needs a time constant of about 64 ms. At 64 ms, a quick stab of pressure takes about 0.2 s to arrive, which you would feel as lag. Options:
   - (a) keep 4 ms, and the test asks only that the glide beats the steps;
   - (b) a longer glide for aftertouch alone, with the bend wheel kept at 4 ms;
   - (c) 64 ms, and the criterion as written.

   Claude's recommendation: (b) at **16 ms**, the bend wheel kept at 4 ms. It is 10 dB under today on a real keyboard (−62.5 dB) and −79 dB on a smooth stream, and it arrives in about 50 ms, so a stab still feels immediate. The criterion would become: under −60 dB for a 7-bit stream, and under −70 dB for an unquantised one, on the Cutoff and the Resonance. Best judged by ear: a resonant bass held, pressed slowly harder, at 4, 16 and 32 ms.

The rest of the brief does not depend on the answer, and is ready to build once it is in. The time constant is one number in the engine and in the model:
- writes only the Destination's AudioParams, gliding;
- the Resonance's curve made once per Mode and Slope, over the Resonance itself rather than around the knob. For a low- or high-pass, the Q in dB is a straight line in the Resonance, so it is not rebuilt when the pressure moves it and the model stays exact;
- the model gliding the pressure as the sound does;
- the Resonance's half reach (decision 4), with the Wobble test.

