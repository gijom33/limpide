# 60: The Demo, longer and smoother; Presets with tremolo

**What to build:** From the owner's inbox lines (2026-10-27): "I love the demo song but the transition from presets to presets is sometimes a bit harsh. Would be nice if transitions were smoother. Could be done via tiny pauses of by moving knobs smoothly in between?" and "Make sure to have presets using tremolo. Make the demo song longer, it's very enjoyable."

**Blocked by:** none

**Status:** done (2026-10-27), to listen to: the breath shortens only the Notes that ran to their part's end (the sixteenths); a long Release, as the Strings' or the Sweep Pad's, still rings into the next part on its new sound

## What makes a change harsh (found before the grilling)

The player loaded each part's Preset up to 0.15 s before its bar line (its look-ahead for handing Notes to the engine), so the last Notes of a part, and their Release, played on the next part's sound.

## Decisions (grilling, 2026-10-27, decided by the owner)

1. **Smoother changes:** each Preset loads at its bar line, not the look-ahead before it, and each part takes a short breath at its end (its last Notes released an eighth of a beat early), so they have faded before the next sound starts. No morphing of knobs between Presets: for a beat the Viewers would show a sound that is neither.
2. **Longer:** about two minutes, the shape of a set kept: Kick (4 bars), Acid (8), Poly Pluck (8), Strings (4), Tremolo Keys (8, new), Self-Oscillation riser (2), Wobble (8), Sweep Pad break (4, new), Poly Pluck again, brighter (8, new), Brass ending (4): 62 bars at 128 BPM.
3. **Two tremolo Presets:** Tremolo Keys (the Electric Piano with a gentle sine tremolo, in Keys & Plucks, played in the Demo) and Trance Gate (a held pad chopped by a Square LFO on Volume at full Depth, in Pads).

- [x] Tremolo Keys and Trance Gate, with a Presets test (`presets.test.ts`)
- [x] The player: Presets load 50 ms before their bar line (in time for the engine to have the first Notes; they loaded up to 150 ms before). Claude's call, open to the owner: "at the bar line" exactly would leave no time to hand the engine the part's first Notes; 50 ms leaves a slow phone's late timer some room, and every part but the last lets go of its Notes an eighth of a beat before its end (`player.test.ts`)
- [x] The track: 60 bars, about 1 min 53 s (the round said 62; the parts add up to 60 with the Brass's two closing bars). Tremolo Keys locks its tremolo to the beat in eighths and deepens, then quickens to sixteenths into the riser; the Sweep Pad's two held chords show the Effective Cutoff climbing; the hook returns with the Cutoff opening to 5 kHz and the Pulse Width back to square (`track.test.ts`)
- [x] CONTEXT.md, the Demo's tip, issue 36's length
