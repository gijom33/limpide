# Review 13: the fact-checker

Checked: the words of the 29 Presets added since v1.15.1 and of every tooltip changed in `src/ui/tips.ts` since then, against the engine, the Modulation laws, the Ideal Reference and rendered sound. The renders ran in Chromium from a temporary engine test, since deleted. Unless a line says otherwise, a Note is A3 (220 Hz) at Velocity 1, and "held still" means the Preset with the Filter open and the LFOs and Env Amount at 0.

## False claims

1. **Zap Pluck** says "every strike starts at full FM, a bright metallic zap, and melts to a pure sine as it decays". The sound does the reverse. A falling saw LFO, restarted, starts at the middle of its ramp (`lfoShape('sawDown', 0) = 0`, as Web Audio's sawtooth does), so each Note starts at the FM knob's own 50 %. FM then falls to 0 (a pure sine) at 1/6 s and jumps to 100 % there. The full-FM zap comes in the tail, 15 dB down, and the cycle repeats at 0.5 s. Measured at A4, as the share of power off the carrier in 20 ms windows: 23 % at 0 ms, 3 % at 140 ms, 82 % at 180 ms (level −27 dB, then −44 dB), 1 % at 480 ms, then 83 % at 500 ms.
2. **Kalimba** says "The sidebands sit far apart, every fourth Harmonic." Osc 2 is two octaves up, so the sidebands sit at f ± 4f. The lower one folds back from −3f to 3f, so the Spectrum shows 1, 3, 5, 7 and 9: every odd Harmonic, two apart. Measured at A4: 3f −11.8 dB and 5f −11.1 dB from the fundamental, 7f −28.5 and 9f −28.0, while 2f and 4f are below −100 dB. The Ideal draws the same: circles at 1, 3, 5, 7 and 9, each within 0.01 dB of the sound.
3. **Kalimba** also says "a quick metallic tine, then a round tone". The tone does not change over the Note. FM is constant, and the Filter (3 kHz, Key Track 50 %) sits above the 3f and 5f sidebands even at the end of its Envelope. 3f and 5f against the fundamental, at 5 ms, 50 ms, 150 ms and 400 ms: A3 −12.0/−11.8, −11.9/−11.4, −11.8/−11.2, −11.8/−11.2; A4 within 1.1 dB of that; A5 within 1.7 dB.
4. **Tine Piano** says "Velocity opens the Filter, so a soft Note is a mellow tine and a hard one barks." Velocity does open the Filter, but it changes nothing you can hear in the tone. FM at 22 % gives partials up to about 4f (−35 dB), all far below even a soft Note's Cutoff. At C2, C3, C4 and C5, Velocity 0.2 against 1, the 2f to 5f levels match each other and an open-Filter render within 0.6 dB (C4: 3f −18.8 soft, −18.9 hard, −18.9 open). A hard Note is only louder: −26 dB against −40 dB.
5. **FM Bell** says "The Filter Envelope makes each strike bright, then mellow". The Filter is set above the bell's partials, so its Envelope barely touches them. At A3, A4 and A5, the 2.56f, 4.56f, 6.13f and 8.13f partials change by under 1.5 dB between 5 ms and 400 ms, and they get slightly brighter, not mellower (A4 8.13f: −12.4 dB, then −11.5 dB). Only soft, high Notes, where the Cutoff starts lower, could hear it.
6. **FM Sidebands** says "sidebands grow either side of the Harmonic". Osc 2 is an octave up, so every lower sideband folds back onto the Harmonic or above it. Nothing appears below the Note: at A4, 0.5f is −90 dB, while 3f is +1.4 dB (louder than the carrier), 5f −11.4 and 7f −23.2. The FM tip's "new partials fan out either side of each Harmonic" has the same flaw: with Osc 2 in tune or whole octaves away, the sidebands land on existing Harmonics and change their levels (FM Ladder, FM Growl). The Ideal is right in both cases, within 0.3 dB.
7. **Osc 1 Octave tip, `how`** says "Set it to −1 and watch the Scope: each cycle takes twice as long." On Init the Scope does not change. Cycle Lock locks to Osc 1 at its Octave (`fundamental()`), and `scopeWindow` draws the set number of cycles (2 by default) across the full width. The Scope has no time axis, so a cycle twice as long is drawn just as wide. Only below about E1 do fewer cycles fit the buffer. This is from the code, not a screenshot.
8. **Osc 1 Octave tip, `body`** says "Osc 2 stays on the Note, so its Octave now sets how far apart the two are". The gap is Osc 2's Octave less Osc 1's: at Osc 1 −1 and Osc 2 0 they are already an octave apart. This is minor but misleading.
9. **FM tip** says "Osc 2 swings Osc 1's pitch up and down hundreds of times a second". Osc 2 swings at its own frequency, so with Osc 2 on the Note that is tens of times a second below A2 (110 Hz). FM Bass and FM Growl are played there. This is minor.

## Unverifiable

- **Pink Surf**: "Switch the Noise to White and hear the hiss come back, and the Spectrum's floor level out." The floor is flat on the Oscillator Tap. After the Filter (1.2 kHz, swung ±1.2 octaves) white Noise is flat only up to about 1 kHz, then falls 12 dB an octave: −7 dB at 2 kHz, −21 dB at 4 kHz and −35 dB at 8 kHz against 250 Hz. Whether that is heard as hiss coming back is a judgement.
- **Clang Alarm**: "hops between a pure sine and a full metal clang two and a half times a second". The LFO makes 2.5 cycles a second, which is 5 hops a second. Measured: full FM for 0–200 ms (84 % off the carrier), a pure sine for 200–400 ms (about 0 %). The wording can be read either way.
- **The words for sound character**: "rubbery, punchy" (FM Bass), "laser zap" (Poly Mod Zap), "tearing, sync-like scream" (Ring Sweep), "like a robot talking" (Robot), "the click and dive of an 808 kick" (808 Boom), "a machine talking to itself" (Machine Chatter), "like light through glass" (Glass Shimmer). These are listening judgements; the mechanisms beneath each one were checked and are in the list below.
- **FM Growl's waveform over time**: the 20 ms windows hold too few cycles at 110 Hz with a 55 Hz Sub to separate them, so the "pure tone to a buzzing growl and back" claim was checked by arithmetic only (true, below).

## Checked true

- **Sine Sub Two Down**: the Sub at f/4, Osc 1 on every fourth rung. The sound matches the Ideal within 0.1 dB, with nothing unmarked above −30 dB.
- **Ring Bell**: only the sum (3.378f) and the difference (1.378f) sound, neither pitch does, and the pair is not harmonic.
- **FM Sidebands**: "the Ideal's circles follow them", within 0.3 dB.
- **Ring Octave**: the product is a square at the Note, with the even Harmonics under −40 dB. The diamonds sit on the odd Harmonics only. Above the 13th they are ±1–3 dB off the sound: the in-tune click the Ring tip describes.
- **FM Ladder**: a ladder from 1 to 6 from two sines, matching the Ideal within 0.3 dB.
- **Breathing Bell**: every four seconds (power off the carrier 100 % at 1 s and 5 s, about 0 % at 3 s and 7 s, so a pure sine), and the ring from 0 to 60 % (the law's room is min(FM, 1 − FM)). The Ideal follows the knob, not the LFO (`viewerStore` passes the knob's Patch).
- **Split Octave Bass**: Osc 1 an octave down, and Cycle Lock follows Osc 1, so the Scope repeats at its cycle.
- **FM Bass**: Osc 2 an octave up at each strike. 2f against the fundamental goes from −19 dB at the strike to +1.8 dB at 0.5 s, and there is a sine Sub.
- **808 Boom**: Osc 2 falls from about 4× to 1× within 60 ms (measured 2.4×, 1.6×, 1.1× and 1.0× at 0, 10, 30 and 60 ms), over a sine Sub with a 1.2 s Decay.
- **FM Growl**: a triangle at 3 Hz, retriggered, sweeping FM from 0 to 100 % (by the law).
- **Poly Mod Zap**: 24 semitones on the Filter Envelope, which also opens the Filter, with FM at 15 %.
- **Ring Lead**: an octave and a tritone up, and the diamonds beside the circles match the sound within 0.33 dB.
- **Ring Sweep**: 19 semitones is an octave and a fifth, and a Decay of 0.5 s is 98 % of the way back at 0.5 s.
- **FM Bell**: 3.56× (2^(22/12) = 3.564), the partials are not Harmonics, 8 Voices, and the circles follow every sideband (within 0.01 dB).
- **Zap Pluck, Kalimba**: the circles match the sound when held still.
- **Tine Piano**: a sine swung by a sine on the Note, and Velocity Cutoff at 0.8.
- **Cathedral**: f/2, f and 2f, matching the Ideal within 0.01 dB.
- **Glass Pad**: an octave and a major third, the diamonds between the circles (within 0.2 dB), and LFO 2 on Detune.
- **Deep Space**: a tritone, a Sub two octaves down, Pink Noise and an LFO on the Cutoff.
- **Glass Shimmer**: two octaves up, LFO 1 swinging FM from 0 to 50 % and LFO 2 on Detune.
- **Clang**: Ring partials at 0.41, 1.59, 2.41 and so on, no ladder (matching the Ideal within 0.01 dB with the Filter open).
- **Zap Tom**: falls from about 2× to 1× in about 150 ms.
- **Gong**: a six-second fade (98 % at the Decay time), and LFO 2 drifting Osc 2 by ±0.24 semitone.
- **Pink Surf**: Pink Noise alone with a slow LFO on the Cutoff.
- **FM Sweep**: LFO 1 on Osc 2 Pitch, ±6 semitones, and the circles at rest (the knob's Patch).
- **Robot**: an octave and a minor third below, and a band-pass rocked by the LFO.
- **Clang Alarm**: the Ideal matches within 0.02 dB.
- **Machine Chatter**: 0 to 100 % (0.25 + 0.25 against a room of 0.5), a slow sine and a fast square, and the fifth.
- **Tips**:
  - Tuning: offsets from the Note, and what wakes the knobs matches `osc2Heard`.
  - Sub: square or sine, one or two octaves down, the odd and even rungs.
  - Sub options: two octaves down, Osc 1 on every fourth Harmonic, a single low spike.
  - Demo: 172.5 s, in the order named.
  - Timeline, Timeline Cutoff and the LFO line: the knob's faint line is no longer drawn, and Pitch is a semitone each way.
  - FM: whatever Osc 2's fader; circles drawn for a Sine Osc 2 or whole octaves, else plain Osc 1; the LFO's swing is even around the knob.
  - Env Amount: ±24 semitones; its `how` gives an octave up, then back (the existing engine test).
  - Ring: "whatever their own faders"; sines a fifth apart give two spikes, neither at the Note; in-tune saws make a click floor about −40 dB under the fundamental from the 32nd Harmonic up, where the Ideal is at −60 to −87 dB.
  - Sub & Noise: true.
  - Noise colour: −3 dB an octave (+8.9, 0, −9.1 dB at 125 Hz, 1 kHz, 8 kHz), and Pink 0.72 dB louder than White.
  - Osc 1 Pitch: true.
  - Osc 2 level: the greying matches `osc2Heard`.
  - Ideal: the diamond for Ring.

Counts: 9 false (5 Presets, 4 tips), 4 unverifiable, about 75 claims checked true.

## Three for the inbox

1. Zap Pluck does the reverse of its words: a falling saw LFO starts mid-ramp, so each Note starts at 50 % FM, is a pure sine at 1/6 s, then jumps to full FM in the tail.
2. Kalimba's sidebands sit on the odd Harmonics (3f and 5f at −12 dB, the lower one folded back), not "every fourth", and its "tine, then a round tone" never happens: the spectrum is the same throughout.
3. The Filter Envelope and Velocity do nothing you can hear in Tine Piano or FM Bell (under 1.5 dB at any time or Velocity), so "a hard one barks" and "bright, then mellow" are false: their Filters sit above every partial.
