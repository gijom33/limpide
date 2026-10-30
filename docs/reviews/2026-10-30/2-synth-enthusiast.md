# Persona review 2: the synth enthusiast

Laptop, 1440 × 900, Chromium (headless, Playwright), a stand-in MIDI keyboard ("Arturia KeyLab Essential 49"), 15 minutes, 2026-10-30, version 1.16.0 (build 328a370), the live site.

Method: as on 2026-10-26, I could not listen. Sound was judged from the Viewers, from an analyser and recorder tapped onto the page's audio output (peak, RMS, the strongest spectral peaks), and from offline renders of the repository's engine in a temporary engine test, deleted afterwards. Not a first visit, so the welcome was skipped. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-2/`.

## First impression

"Same panel, but the Oscillators grew up. Osc 1 has an Octave and an FM knob now, the Mixer has a Ring fader, the Sub can go two octaves down as a sine, and there's Pink Noise. That's a Prophet-style Poly Mod and a ring mod on a teaching synth. The MIDI button still finds my keyboard on its own." (`01-landing.png`)

## What they tried

1. **The new Presets, from the keyboard.** The Patch menu now has about 150 Presets. I played Ring Bell, FM Bell, FM Bass, Sub Two Down, Pad and Electric Piano, then rendered Ring Bell, FM Bell, FM Bass, 808 Boom, Sub Two Down, Poly Mod Zap, Ring Lead, Gong and Cathedral offline. (`02-patch-menu.png`)
   - Ring Bell at C4 gave exactly two peaks, 361 Hz and 884 Hz: the difference and the sum of C4 and a sine an octave and a minor third up, and neither pitch. The Ideal's diamonds sit right on them. "That's a ring modulator, done right." (`p-Ring_Bell.png`)
   - FM Bell played a C minor chord on 8 Voices, the four Notes plus sidebands between them. FM Bass and Poly Mod Zap have the snap on the attack the descriptions promise: Osc 2 thrown up by the Filter Envelope.
   - Levels stay sensible: peaks 0.06 to 0.33 of full scale on every Preset I rendered, nothing clipped.
   - Sub Two Down at C2 puts its sine Sub at 16 Hz, below hearing. That is the Note's fault, not the Preset's, but a bass player will try it there.
2. **Chords on Pads.** Pad and Electric Piano now have 8 Voices and sounded all four Notes of the chord. (`p-Pad.png`)
3. **The keyboard's own controls.**
   - Program Change 1 loaded Pure Sine.
   - The bend wheel all the way up moved C4 from 261 Hz to 293 Hz: two semitones. The range can be set to 2, 7 or 12.
   - The sustain pedal held a released Note, and it stopped when the pedal lifted.
   - The mod wheel set LFO 1 Depth (79 % at CC 100). On Init LFO 1 goes to the Cutoff, so the wheel gives a filter wobble rather than vibrato. That is already in the inbox.
4. **A sound of my own from Init**, with the mouse. (`22-own-sound-playing.png`)
   - Osc 1 an octave down, FM 25 %. Osc 2 a silent sine an octave up, with Env Amount +14 st.
   - A sine Sub at 20 %, Ring at 8 %.
   - 24 dB, Cutoff 423 Hz, Resonance 43 %, Envelope Amount +3.5 oct, Filter Decay 51 ms, Filter Sustain 0. Amp Attack 1 ms.
   - The result: a growling FM bass with a zap on every Note. An eight-note line peaked at 0.40 of full scale.
   - The tab dots helped: Osc 2 showed as sounding once FM used it, even with its fader at 0. "Nice: it tells me Osc 2 is working even though I can't hear it on its own."
   - The mouse wheel turns knobs now. But it would not move Osc 1's Octave: six notches did nothing. I had to drag it.
5. **Save and share.** I saved the sound as "FM Growl Bass" and pressed Copy share link. In a fresh browser the link opened as "FM Growl Bass", with "Play to start the sound". (`25-friend-opens-link.png`)
6. **MIDI Learn on the new knobs.** (`31-learn-mapped.png`, `32-midi-panel-mappings.png`)
   - FM went to CC 20 and Ring to CC 21, switching to the Mixer tab mid-Learn. Osc 2's Env Amount went to the bend wheel, which Learn now accepts.
   - The Mappings list reads "FM", "Ring", "Osc 2 Env Amount", "Pitch bend".
   - Quick Setup now runs to 27 steps.
   - After Learn, turning CC 20 from 60 to 127 left FM at 0 %. That is Pickup: the hardware knob has to come back down to 0 first. Correct, but it puzzled me for a moment.
7. **Notes played into a Release.** I wanted to know what "the Oscillators restart on each Note" means when I play staccato, so I rendered it offline (no ear involved: the steepest step between samples, and a second difference for high-frequency bursts).
   - On Init with a sine, on one Voice, I played C2, let it go, and played D2 50 ms later. The previous Note was still 24 dB down in its Release. 4 ms after the second Note On, the wave jumps 16 times further than the steepest step of the steady sine. With a 1.5 s Release it jumps 28 times further.
   - Re-pressing the same key gives the same jump. So does a third Note on 2 Voices, stealing a held one (18 times).
   - Glass Pad has a 1.2 s Attack, so a chord struck again in its Release should come in softly. It gives a high-frequency burst 3.6 times its sustain's.
   - With a short Release (50 ms) there is no jump: the sound has died away first.
8. **FM on a saw, high up.** I rendered Init's saw with FM at C4 to C6 and measured the energy that falls between the Harmonics. With Osc 2 in tune, every real FM sideband lands on a Harmonic, so whatever falls between them can only be aliasing.
   - Saw at C6: −101 dB at FM 0 %, −50 dB at 50 %, −36 dB at 100 %.
   - Saw at C4: −57 to −51 dB. Square at C6, FM 50 %: −47 dB.
   - Sine at C6, FM 100 %: −84 dB, clean. The FM Presets all use sines, so they stay clean.
9. **Glide.** The knob now covers 21 ms at 20 px, 181 ms at 60 px and about a second at 140 px. The slow start I found last time is gone.

## What worked

- Ring and FM are the real thing. They add sums, differences and sidebands, and the Ideal's diamonds and circles predict them. No other learning synth I know shows that.
- Poly Mod (the Filter Envelope on Osc 2's pitch) is the most "synth player" feature added. FM Bass, Poly Mod Zap and 808 Boom show what it's for.
- Every 1.8.1 finding of mine is fixed. Pitch bend, the sustain pedal, the mod wheel and Program Change all work. Learn takes the bend wheel. Pads and Keys play chords. The share link keeps the name. Mappings have full names. The mouse wheel turns knobs. Glide has a usable start.
- The new Presets are well chosen. Each one shows one idea and also sounds like something (Gong, Cathedral, Deep Space, Clang Alarm).
- Levels are consistent across the new Presets, and nothing clips.

## Where they got stuck or gave up

- **A tick on staccato lines and on chords struck again.** The Oscillators restart even while the last Note is still sounding in its Release. The legato fix covers only a key that is still held. Not heard: measured.
- **The mouse wheel can't turn the Octave knobs.** One notch is 4 % of the travel, and the knob rounds it back to the same whole octave. The arrow keys step properly. A trackpad's small scrolls can't move Semitone either.
- **FM on a saw or square gets gritty in the top octaves**: inharmonic energy at −50 to −36 dB around C6. Sines stay clean.
- Pickup on a mapped knob at 0 waits until the hardware knob reaches 0. That is standard, but nothing on the knob says it is waiting for me.
- Still missing compared with every synth: effects (in the inbox), oscillator sync (there's a "Sync-ish Lead"), unison and spread, LFO tempo sync, and a free-running option for the Oscillators. A Reese now starts in phase on every Note.

## Would they

- **Like it: yes.** It got deeper without getting messier, and Ring, FM and Poly Mod are what I'd have asked for next.
- **Share it: yes.** Message to a synth friend: "look at the FM sidebands and the ring mod's sum and difference on the Spectrum". The share link now keeps the patch's name.
- **Come back: yes.** To sketch FM and ring patches and watch what they do. It still isn't for recording: no effects, no unison.
- **Recommend it: yes.** For learning, ahead of *Learning Synths*, which has no FM or ring mod at all. As an instrument it gets closer each release.

## Since 1.8.1

- **Fixed:**
  - Pitch bend (±2, 7 or 12 st), the sustain pedal, the mod wheel (on LFO 1 Depth) and Program Change
  - MIDI Learn takes the bend wheel
  - Pads and Keys on 8 Voices
  - Full names in the Mappings list
  - The share link keeps the Patch's name
  - The mouse wheel turns knobs
  - Glide's slow start
  - A master Volume knob
  - Volume as an LFO Destination (tremolo)
- **New and good:** Ring, FM, Poly Mod (Env Amount), Osc 1 Octave, the Sub one or two octaves down and square or sine, Pink Noise, FM as an LFO Destination, and 29 new Presets.
- **New and not right yet:**
  - The Oscillators restart on Notes played into a Release
  - The wheel doesn't move the Octave knobs
  - FM aliases on rich Waveforms
- **Still missing:** effects, sync, unison, LFO tempo sync.

## Three findings, ranked

1. Clicks: a Note played while the previous one is still in its Release restarts the Oscillators mid-sound. The steepest step between samples is 16× the steady sine's on Init (28× with a 1.5 s Release), and the burst is 3.6× Glass Pad's sustain when a chord is struck again. A stolen held Voice jumps 18×. Issue 94's legato fix covers only a key still held. Measured by offline render, not heard.
2. The mouse wheel can't turn Osc 1's or Osc 2's Octave: a notch (4 % of travel) rounds back to the same octave, while the arrow keys step a whole one. Small trackpad scrolls can't move Semitone either. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-2/22-own-sound-playing.png`
3. FM on a saw or square aliases in the top octaves. With Osc 2 in tune, the energy between the Harmonics is −50 dB at FM 50 % and −36 dB at 100 % on a C6 saw, against −101 dB without FM. A sine stays clean (−84 dB).
