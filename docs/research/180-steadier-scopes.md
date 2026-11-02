# 180: Steadier Scopes: the measurements

The measurement [issue 180](../issues/180-steadier-scopes.md) asks for before its grilling: which sounds move on the Scopes today, by how much from frame to frame, on each Tap, and what each way of steadying them does on the same signals. It ends with a recommendation for each grilling question, not decisions. Claude's research pass, 2026-11-02, open to the owner.

## Method

- **Signals.** The real engine (`createSynthEngine`) rendered offline at 48 kHz in Vitest's browser mode (Chromium), the engine project's set-up, with the Amp Tap on all Voices (the app's default). The render was suspended every 1/60 s from 0.6 s to 4.1 s (210 frames); at each stop the three Taps' 8192-sample buffers were read, with `fundamental()`, exactly what each Scope reads on a frame. A temporary test file, deleted, never committed.
- **Today's trace.** As `scope.ts` draws it: `scopeWindow` at 2 cycles (the default), `cycleLockOffset` on the buffer less the window, `scopeTrace` at 600 points (a 300-pixel Scope).
- **Jitter (J).** The RMS of the difference between two consecutive drawn traces, over their RMS, in %; the median and the 95th percentile over the frames (written `median/p95`). A reading guide: under 1 % is below a pixel; 5 % a visible quiver; 20 to 40 % clearly moving; two unrelated traces score about 141 %.
- **Floor.** For each frame, the best match to the previous trace from any start later in the buffer: what is left is the wave's own change, which no choice of start can remove (approximate: it is measured against today's previous trace).
- **Notes and sounds.** C3 (130.8 Hz) unless named: Reese on C2 (its Sub at 32.7 Hz), Lead on C4, chords on C4. Presets by name; a gesture written as changed from Init.
- **Ways.** Each a small pure function on the same buffers. Its cost: timed in the same Chromium on 30 frames for 0.4 s, in ms per Scope per frame (C3, 2 cycles, 600 points); a frame draws three Scopes.

The Filter and Amp Taps measure alike on every one-Voice sound here (the Amp holds at Sustain), so the tables give the Oscillator and Amp Taps, and the Filter where it differs.

## Two things found in today's Cycle Lock

1. **The trace is the oldest part of the buffer.** The lock starts the trace at the first rising zero it finds from the buffer's start, so the Scope draws the sound as it was about 150 ms ago (152 ms at C3, 165 ms for a chord at C4, 94 ms at C2), while the Spectrum's window is centred about 85 ms ago.
2. **It locks at the pitch of now, as if it never moved.** `fundamental()` follows the Glide and the bend at this instant but leaves out an LFO on Pitch, and the lock measures the phase over the whole 150 ms window as if one frequency held throughout. Through vibrato or a Glide the measured phase is wrong, and the trace slides. The Slow Vibrato Preset says the Scope "stays locked through it"; measured, it moves 46 % a frame.

## Today: jitter per sound and Tap

| Sound | Oscillator | Filter | Amp | Amp floor |
|---|---|---|---|---|
| Init (a saw) | 0.7/1 | 0.1/0 | 0.1/0 | 0.1 |
| Init, Osc 2 +3 cents | 10.7/17 | 5.8/10 | 5.8/10 | 5.7 |
| Init, Osc 2 +10 cents | 26.9/42 | 18.3/34 | 18.3/34 | 16.9 |
| Init, Osc 2 +30 cents | 49.2/133 | 49.4/133 | 49.4/133 | 38.2 |
| Slow Beats (sines, 4 cents) | 1.4/18 | 1.4/18 | 1.4/18 | 1.4 |
| Reese (18 cents, Sub; C2) | 24.3/36 | 15.9/28 | 15.9/28 | 17.6 |
| Lead (9 cents, vibrato, Glide; C4) | 61.6/101 | 81.3/125 | 81.3/125 | 31.8 |
| PWM Morph (LFO on Pulse Width) | 19.6/26 | 17.6/26 | 17.6/26 | 18.4 |
| Deep Sweep (LFO on Cutoff) | 0.7/1 | 3.7/9 | 3.7/9 | 3.2 |
| Resonant Ring (Resonance 0.9) | 0.7/1 | 0.1/0 | 0.1/0 | 0.1 |
| Self-Oscillation | 0.7/1 | 0.0/0 | 0.0/0 | 0.0 |
| FM Ladder (FM, ratio 1) | 0.0/0 | 0.0/0 | 0.0/0 | 0.0 |
| FM Sidebands (FM, ratio 2) | 0.0/0 | 0.0/0 | 0.0/0 | 0.0 |
| FM Ladder, Osc 2 +7 st (ratio 1.5) | 3.0/167 | 3.0/167 | 3.0/167 | 1.3 |
| FM Ladder, Osc 2 +6 st (ratio 1.414) | 131/161 | 131/161 | 131/161 | 11.9 |
| Ring Octave (Ring, ratio 2) | 0.8/1 | 0.8/1 | 0.8/1 | 1.1 |
| Ring Bell, held (Ring alone, ratio 2.38) | 142/166 | 142/166 | 142/166 | 3.2 |
| Perfect Fifth (sines, 3:2) | 1.5/141 | 1.5/141 | 1.5/141 | 0.8 |
| Tritone Knot (saws, ratio 1.414) | 88.0/103 | 88.2/103 | 88.2/103 | 34.0 |
| Sub Ladder (Sub on) | 0.6/1 | 0.6/1 | 0.6/1 | 0.9 |
| Init, white Noise 0.3 | 39.3/41 | 19.8/22 | 19.8/22 | 18.0 |
| Deep Breath (pink Noise, Sub; C3) | 33.2/45 | 33.2/45 | 33.2/45 | 29.2 |
| Slow Vibrato (2 Hz) | 47.3/62 | 45.6/61 | 45.6/61 | 4.2 |
| Fast Vibrato (8 Hz) | 61.0/78 | 60.1/78 | 60.1/78 | 3.4 |
| Portamento (Glides C3, G3, G2) | 76.9/153 | 78.8/149 | 78.8/149 | 5.0 |
| Init on 8 Voices: C major (C4 E4 G4) | 2.3/3 | 0.2/0 | 49.5/139 | 34.6 |
| Init on 8 Voices: C minor 7th | 2.5/3 | 0.2/0 | 116/160 | 50.1 |
| Init on 8 Voices: octave (C3 C4) | 1.1/2 | 0.1/0 | 0.1/139 | 0.1 |
| Organ: C major | 0.0/0 | 0.0/0 | 51.1/154 | 31.5 |

Three groups:

- **The lock's fault (today far above the floor).** Vibrato (46 to 61 % against a floor of 3 to 4), Glide (79 against 5), the Lead (81 against 32), Ring and FM at ratios that are not whole (131 to 142 against 3 to 12), the Tritone Knot (88 against 34). And rare flips that only the 95th percentile shows: Perfect Fifth and FM at 1.5 (141, 167), where the pattern repeats every two cycles of the Note and the lock jumps between the two; the octave chord (139), where two cycles of C4 are one of C3; every chord on the Amp Tap.
- **The sound's own change (today about the floor).** Detune (6 to 49 %), PWM (18 %), the Filter LFO (4 %), the Reese, Noise (20 to 39 %), the chords' remaining 35 to 50 %. No lock can freeze these without hiding what the sound does.
- **Steady (under 1 %).** A plain saw, high Resonance, Self-Oscillation, FM and Ring at whole ratios, the Sub. On the Oscillator Tap a saw's drop flickers by a pixel (0.7 %: the lock's phase wanders by 0.3 of a sample), invisible after the Filter.

The Oscillator and Filter Taps follow the newest Note, so a chord moves on the Amp Tap alone.

## The trap in matching the last frame

Way 1 as first written (of the starts a period apart, the one most like the previous trace) scored near zero on Noise (0.9 against 19.8), the Tritone Knot (0.2 against 88) and FM at 1.414 (0.0 against 131). It had cheated: the 8192-sample buffer still holds the samples the previous frame drew (a frame moves it on by 800), so the best match is often the same audio again. In 81 to 86 % of frames it drew sound no newer than the frame before, a frozen Scope that jumps when the old samples leave the buffer. **Every matching way below is held to start at least half a frame (400 samples) after the previous trace**, and with that rule those gains vanish. (On very low notes a cycle is longer than a frame: at the Reese's 32.7 Hz every locked trace, today's included, shows each cycle about twice, 45 % of frames. That is honest: the sound has not moved on by a cycle.)

## The ways, on the same sounds

Jitter on the Amp Tap (the Oscillator Tap for Init), `median/p95`. **Match** is way 1 from today's lock. **Tracked** is a lock found while measuring, outside the issue's list: the fundamental's phase followed along the pitch the engine plays (vibrato, Glide, bend), measured over the whole buffer, the trace at the buffer's newest end. **Tracked + match** adds way 1 to it, among the fundamental's last 9 rising zeros. **Average of 8** is way 3, then what it hides (the RMS difference between the averaged trace and the true one, % of its RMS).

| Sound | Today | Match | Tracked | Tracked + match | Average of 8: J, hides |
|---|---|---|---|---|---|
| Init (Oscillator Tap) | 0.7/1 | 0.7/1 | 0.8/1 | 0.7/1 | 0.5, 0.9 |
| Osc 2 +3 cents | 5.8/10 | 5.5/9 | 5.8/9 | 5.6/9 | 5.7, 12.8 |
| Osc 2 +10 cents | 18.3/34 | 16.0/30 | 17.7/35 | 16.5/32 | 15.9, 31.6 |
| Osc 2 +30 cents | 49.4/133 | 43.1/129 | 49.5/124 | 44.3/132 | 35.4, 50.8 |
| Reese (C2) | 15.9/28 | 16.3/28 | 16.2/28 | 16.2/28 | 11.1, 25.2 (4 fit) |
| Lead (C4) | 81.3/125 | 35.7/114 | 33.4/116 | 33.0/116 | 60.1, 47.6 |
| PWM Morph | 17.6/26 | 17.6/20 | 17.9/26 | 17.6/26 | 14.6, 23.3 |
| Deep Sweep | 3.7/9 | 3.7/8 | 3.3/9 | 3.2/9 | 3.5, 6.2 |
| FM ratio 1.5 | 3.0/167 | 3.0/6 | 3.0/167 | 3.0/6 | 4.0, 104 |
| FM ratio 1.414 | 131/161 | 126/136 | 131/158 | 125/136 | 84.0, 118 |
| Ring Bell, held | 142/166 | 124/130 | 141/164 | 124/130 | 140, 141 |
| Perfect Fifth | 1.5/141 | 1.5/3 | 1.5/141 | 1.5/3 | 0.0, 81.6 |
| Tritone Knot | 88.2/103 | 87.5/96 | 88.2/102 | 87.8/96 | 18.8, 67.5 |
| White Noise 0.3 | 19.8/22 | 19.5/22 | 19.8/22 | 19.5/22 | 3.7, 13.2 |
| Slow Vibrato | 45.6/61 | 45.4/60 | 2.0/5 | 1.4/3 | 16.7, 55.3 |
| Fast Vibrato | 60.1/78 | 57.4/70 | 5.5/13 | 5.3/11 | 27.3, 48.5 |
| Portamento | 78.8/149 | 4.7/99 | 13.1/80 | 3.1/80 | 3.5, 41.7 |
| Chord C major | 49.5/139 | 39.3/55 | 54.7/141 | 38.3/63 | 22.9, 84.1 |
| Chord C minor 7th | 116/160 | 74.3/92 | 119/161 | 76.2/96 | 39.0, 94.2 |
| Chord octave | 0.1/139 | 0.1/0 | 0.1/139 | 0.1/0 | 0.1, 79.9 |
| Organ chord | 51.1/154 | 48.8/60 | 50.6/159 | 49.2/60 | 15.8, 94.0 |
| Age of the trace | 94 to 165 ms | 5 to 148 ms | 1 to 16 ms | 4 to 64 ms | as today |

The steady sounds (Resonant Ring, Self-Oscillation, FM and Ring at whole ratios, Sub Ladder) stay under 0.8 % with every way. The Portamento's 95th percentile (80) is the moment a new Note starts, a real change. Measured over 8 periods instead of the whole buffer, the tracked lock gave the same numbers except on chords, where the other Notes leak into so short a window (the Organ chord 98 to 111 %); the whole buffer is the one to build.

Also tried, not kept: **any start** (way 1 with starts within a period, the best match anywhere after the previous trace) steadies the Ring Bell (142 to 16 %) but nothing else better than the match, costs 0.53 ms, and lets the trace's left edge drift 10 to 27 % of a period off the fundamental's rising zero, losing what Cycle Lock promises.

### Averaging: what it hides

| Sound, Amp Tap | 2 cycles: J, hides | 4 cycles | 8 cycles |
|---|---|---|---|
| PWM Morph | 16.8, 5.8 | 15.4, 14.2 | 14.6, 23.3 |
| Osc 2 +10 cents | 18.0, 6.0 | 17.5, 16.7 | 15.9, 31.6 |
| White Noise 0.3 | 14.2, 9.8 | 7.2, 12.2 | 3.7, 13.2 |
| Slow Vibrato (today's lock) | 38.4, 16.8 | 26.8, 34.9 | 16.6, 55.3 |
| Perfect Fifth | 0.0, 81.6 | 0.0, 81.6 | 0.0, 81.6 |

At C3 the average spans 15, 31 and 61 ms: a PWM sweep is drawn as a blur of the widths of that span. Its best scores are its worst lies: the Perfect Fifth stands perfectly still as a wave that never sounds (the average of its two different cycles, 82 % off the real one; FM at 1.5, 104 %), and the Noise is drawn away. On the detuned saws it steadies little (18 to 16 %) for a third of the wave hidden.

### Phosphor persistence

No steadiness score: what changes on the screen from frame to frame, as % of one trace's ink, with each frame keeping its past dimmed by the decay (0.5, 0.7, 0.85 a frame: the glow halves in 17, 33 and 71 ms).

| Sound, Amp Tap (traces) | Off | 0.5 | 0.7 | 0.85 |
|---|---|---|---|---|
| Init, Oscillator Tap (today) | 16.6 | 11.5 | 8.8 | 5.8 |
| Osc 2 +10 cents (today) | 77.7 | 61.6 | 55.5 | 50.3 |
| PWM Morph (today) | 102 | 82 | 76 | 71 |
| White Noise 0.3 (today) | 106 | 72 | 55 | 39 |
| Slow Vibrato (today) | 120 | 95 | 89 | 76 |
| Slow Vibrato (tracked + match) | 21 | 13 | 9 | 6 |
| Chord C major (tracked + match) | 129 | 104 | 97 | 88 |

It calms the flicker of what wobbles about one shape (Noise to about a third, a pixel's flicker to a third), a third off detune and PWM, little on a trace that is new each frame (a chord, the Tritone Knot: a cloud). It hides nothing that was drawn but adds the past: at 0.85 the last 100 ms or so glow under the trace, so a PWM sweep shows ghosts of earlier widths. On a steadied Scope it is nearly invisible.

### Chords

On the Amp Tap only. Today's lock follows the newest Note, so the window is two cycles of the chord's top Note.

| Lock | C major | C minor 7th | Organ C major | Octave |
|---|---|---|---|---|
| Today (newest Note) | 49.5/139 | 116/160 | 51.1/154 | 0.1/139 |
| Lowest Note | 42.2/152 | 99.0/124 | 57.1/156 | 0.1/0 |
| Lowest Note + match | 35.4/54 | 90.8/118 | 47.0/58 | 0.1/0 |
| Shared period (4:5:6, 10:12:15:18) | 0.1/86, stale 64 % | 1.0/109, stale 67 % | 0.1/92, stale 64 % | 0.1/0 |
| Shared period + match | 35.2/59 | 94.9/105 | 48.7/50 | 0.1/0 |
| Newest Note, tracked + match | 38.3/63 | 76.2/96 | 49.2/60 | 0.1/0 |

What steadies a chord is the match (the 95th percentile from 139 to 160 down to 54 to 118), not which Note it locks to. The shared period, found from every Note's phase, freezes: equal temperament's major third is not 5:4, so the moment where the Notes line up best stays the same moment in the buffer for several frames (64 to 67 % of frames draw no newer sound), then jumps. The 35 to 90 % left is the chord's own beating, real at this zoom.

### Cost, ms per Scope per frame

| Way | ms |
|---|---|
| Today (lock 0.166, trace 0.002) | 0.166 |
| Today's lock, Hann window kept and sin/cos by rotation (review 18's fix; the same offsets within 0.01 sample) | 0.019 |
| Match, from today's lock | 0.226 |
| Any start | 0.53 |
| Average of 2, 4, 8 cycles | 0.173, 0.177, 0.186 |
| Tracked, whole buffer | 0.097 |
| Tracked + match | 0.124 |
| Chord: lowest Note; + match; shared period (4 Notes) | 0.178; 0.321; 0.407 |
| Phosphor | no work per sample: a translucent fill instead of `clearRect` (not timed) |

The tracked lock is already cheaper than today's, with the window's cosine still worked out per sample; keeping the Hann window, as [review 18](../reviews/2026-11-02/18-performance-expert.md) (finding 3) suggests, lowers it further. The match adds a trace and a comparison per candidate (9 at most).

## What each way hides or misleads

- **Tracked lock:** nothing hidden; every trace is real sound, and newer (1 to 16 ms old, 64 at most with the match, instead of 94 to 165). It counts on the engine knowing the pitch it plays, which it does (Note, Glide, LFOs on Pitch, bend, aftertouch). It keeps Cycle Lock's promise: the trace starts on the fundamental's rising zero.
- **Match:** real samples, the left edge still on a rising zero of the fundamental. Misleading only without the forward rule (a frozen Scope). Among equally good candidates it should take the newest, or the trace ages to 60 ms for nothing (not measured).
- **Phosphor:** shows the past with the present, by design; read as a long exposure it does not lie, but the glow is not the sound now.
- **Averaging:** draws shapes the sound never makes and erases what does not repeat, Noise first. It lies most where it looks best.
- **Chords:** the shared-period lock freezes then jumps; the lowest-Note lock is harmless and no steadier.

## For the grilling

1. **Fix Cycle Lock itself (the tracked lock).** Not among the issue's four ways, but the largest gain measured: vibrato from 46 to 61 % to 2 to 8, Glide from 79 to 13, the Lead from 81 to 33, the trace 150 ms younger, and cheaper than today. Claude's recommendation: build it, with no setting: it corrects the lock, it is no matter of taste.
2. **Match the last frame:** build, always on, held to move forward, choosing among the fundamental's rising zeros and preferring the newest. It removes the flips: Perfect Fifth and FM at 1.5 from 141 to 167 % to 3 to 6 at the 95th percentile, the octave chord from 139 to 0, chords to 54 to 118, a Glide from 13 to 3. With the tracked lock, 0.124 ms. No setting: it never alters a sample.
3. **Phosphor persistence:** the Display choice the owner foresaw. It suits Noise and detune (at 0.85, Noise's flicker cut to a third, detune's by a third), and some will dislike the ghosts. Recommendation: offer Off and On (a decay near 0.7, the glow halving every 33 ms), Off by default, so the Scope shows only now unless asked.
4. **Averaging over cycles:** do not build, not even as a setting: its steadiest pictures are false (82 % off on the Perfect Fifth) and it erases Noise. Dropped, with the reason.
5. **Chords:** keep locking to the newest Note, as the Oscillator and Filter Taps and the period in the Synth Geek Layer do; the match does the steadying. No shared-period lock (it freezes). Lowest Note: no setting; it measured no steadier.
6. **What should keep moving:** detune, PWM, a Filter LFO, Noise, the Reese, the Tritone Knot, FM and Ring at ratios that are not whole, a chord's beating. Their floor is today's jitter: the Scope is right. After 1 and 2, the Slow Vibrato Preset's "stays locked through it" becomes true (1.4 %).
