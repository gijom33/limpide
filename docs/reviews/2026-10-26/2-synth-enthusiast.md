# Review 2: the synth enthusiast

Persona: plays hardware and software synths (Minimoog, Juno, Vital, Serum), knows Ableton's *Learning Synths*. Laptop at 1440 × 900 in Chromium, a MIDI keyboard plugged in, 15 minutes. This was not a first visit, so the welcome was skipped (`limpide.welcomed` = `1`).

Method: the live site (version 1.8.1, build 2ba9f3a), driven by Playwright in headless Chromium. The MIDI keyboard was a stand-in that reported itself as "Arturia KeyLab Essential 49" and sent note, CC, pitch bend and program change messages. I could not listen. What I say about sound comes from the page's Scope, Spectrum, Response Curve and Envelope Timeline, and from an analyser and recorder I attached to the audio output (peak and RMS level, the strongest spectral peaks, the level envelope in 1–20 ms windows). Anything that depends on hearing it is marked as not verified.

Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/2-synth-enthusiast/`.

## First impression

"OK, this is a classic two-oscillator subtractive mono synth, laid out like a hardware panel: Oscillators, Filter, Amp from left to right, LFOs and envelopes along the bottom. What's new is that every section has its own scope and spectrum, so I can see the saw lose its top end after the filter. It looks a lot more serious than *Learning Synths*. A real 24 dB ladder-style low-pass, Key Track, Velocity → Cutoff, a Sub, Glide, up to 8 voices. The top bar says MIDI 1 in green, so it found my keyboard without asking. Nice."

(`01-landing.png`)

## What they tried

1. **Opened the Patch menu.** About 120 Presets in 15 rows, from teaching patches (Shapes, Intervals, Filter, Envelope, LFO) to sounds (Bass, Leads, Keys & Plucks, Pianos, Pads, Chords, Drums, Movement & Effects). "That's a lot of Presets, and the teaching rows are a nice touch." (`02-patch-menu.png`)
2. **Played Presets from the MIDI keyboard.** Bass, Acid, Reese, Screamer, Singing Lead, Wobble and Electric Piano got single notes. Pad and Electric Piano got a C minor chord.
   - Acid: 24 dB, Resonance 80 %, Envelope Amount +3.5 oct, 150 ms filter decay, 60 ms Glide, Velocity → Cutoff 50 %. "That is an actual acid patch." The Envelope Timeline showed the cutoff spiking and falling on each note. (`p-Acid.png`)
   - Output levels were sensible and consistent: bass and lead patches peaked at 0.27–0.56 full scale (RMS −14 to −22 dB). Nothing clipped.
   - **Pad and a chord:** I held C3, G3, C4 and E♭4, and only E♭4 sounded. The Voices row showed 1. Seven of the nine Pads are on 1 Voice: Pad, PWM Strings, Warm Pad, Brass Swell, Choir, Sweep Pad and Dark Drone. Only Shimmer Pad and Breathing Pad have 4. So are Organ, Electric Piano, Marimba, Glass Keys, Harp and Clav in Keys & Plucks. Chords only work in the Pianos and Chords rows. "Why is a string pad mono? I had to look at the Voices row to work out why my chord came out as one note." (`p-Pad.png`)
3. **Pushed the Filter's Resonance** on Init (a saw at C2). I swept Cutoff from 80 Hz to 20 kHz at Resonance 0, 50, 86 and 100 %, at 12 and 24 dB.
   - The bass did not thin out. The fundamental stayed at −37 dB at every Resonance setting, so there is no volume dip as on some ladder emulations.
   - The resonant peak is strong but stays under control. At 24 dB and 100 % with Cutoff at 1.26 kHz, the harmonic nearest the Cutoff came out about 23 dB above where a plain saw would put it, and the overall level rose only 4–5 dB. The Filter Scope rings visibly at every cycle. (`07-res100-24dB.png`)
   - At a 20 kHz Cutoff, energy above 8 kHz was the same (about −25 dB of the total) at Resonance 0 % and 100 %. Nothing turned into hiss.
   - The "Self-Oscillation" Preset gives a whistle that follows the keyboard: a peak at 786 Hz for C4 and 1572 Hz for C5.
   - "It looks musical: it rings, it squelches, it doesn't blow up. At 100 % I'd half expect it to scream on its own like a Minimoog, but there's a Preset for that." Whether it *sounds* musical is not verified by ear.
4. **Checked the Envelopes.** Amp Attack, Decay and Release all go from 1 ms to 10 s. Filter Attack and Decay also start at 1 ms. Envelope Amount runs from −5 to +5 oct.
   - With Amp Attack at 1 ms, the output reached its peak within 2–6 ms of the note. With Decay at 99 ms and Sustain at 0, the level was down about 20 dB at 50 ms and silent by 150 ms. "Snappy enough for plucks and kicks."
5. **Tried Glide.** At a knob position of 70 % (631 ms), C3 → C4 slid up over about half a second, and letting go of C4 slid back to the held C3 (last-note priority). That works properly for mono leads.
   - The knob is very slow at the start: dragging it 40 px up from Off only reached 6.3 ms, which you won't hear.
6. **Tried the LFOs.** Each LFO has five shapes, a Rate of 0.05–20 Hz, Depth, Retrigger, and one Destination: Cutoff, Resonance, Pitch, Osc 2 Pitch, Detune or Pulse Width.
   - LFO 1 at 1.24 Hz and 60 % on Cutoff drew a clear sine on the Effective Cutoff line of the Timeline. (`29-lfo-cutoff.png`)
   - "Useful for wobble and vibrato. But there's no tempo sync and no Amp destination, so no tremolo."
7. **Made a sound from Init**, with the mouse only:
   - Osc 2 at 53 % and detuned +4 ¢, Sub at 16 %
   - 24 dB, Cutoff 356 Hz, Resonance 50 %, Envelope Amount +3 oct, filter Decay 113 ms, filter Sustain 0
   - Amp Attack 1 ms, Release 82 ms

   The knobs drag vertically (about 200 px for the full range) and reset on a double-click. The mouse wheel does nothing on them. I played a short bass line from the MIDI keyboard: punchy notes, peaks of 0.2–0.5 and no clipping. The Timeline showed a filter spike on every note. The Filter Scope showed the detuned saws beating. (`26-own-sound-playing.png`)
   - I saved it as "Fat Saw Bass" under My Patches, then pressed Copy share link. The status line read "Link copied: anyone who opens it hears this Patch." (`27-saved-and-shared.png`)
   - In a fresh browser, the link opened a welcome card with "Play the shared sound", and the patch name read "Shared Patch", not "Fat Saw Bass". (`28-friend-opens-link.png`)
8. **Mapped the controller with MIDI Learn.**
   - MIDI → MIDI Learn put dashed outlines on every mappable control, with a bar at the bottom: "Click a knob or button to map, then move a control on your Controller." (`10-learn-on.png`)
   - I clicked Cutoff and turned CC 74. One message gave "Cutoff: keep turning…", and a short turn finished the mapping. Resonance went on CC 71, Filter Envelope Amount on CC 72, and the mod wheel (CC 1) on LFO 2 Depth for vibrato. Esc finished. (`12-learn-cutoff-mapped.png`, `13-learn-two-mapped.png`)
   - Pickup worked as on hardware. Turning CC 74 from 40 to 60 left Cutoff at 2.00 kHz. Once the knob passed the current value it took over: 4.61 kHz at 100, 59 Hz at 20.
   - The mappings survived a reload.
   - The MIDI panel lists the mappings as "Cutoff", "Resonance", "Amount" and "Depth". "Amount of what? Which LFO's Depth?" (`19-midi-panel-after.png`)
   - Quick Setup opens "1 of 25", starting at "Osc 2 · Detune". I didn't go through it. (`23-quick-setup.png`)
9. **Reached for the controls every keyboard has.**
   - Pitch bend (full up) did not move the pitch: still 264 Hz on C4.
   - The mod wheel did nothing until I mapped it.
   - With the sustain pedal (CC 64) down, the note stopped at note-off: silent 1.2 s later.
   - A program change (0xC0, 5) did not change the Preset.
   - In MIDI Learn, moving the pitch bend wheel on a selected Detune knob mapped nothing. The bar kept asking me to "move a knob, fader or pad". (`21-learn-pitchbend.png`)
   - Velocity works: velocity 20 played about 16 dB quieter than 127.

## What worked

- The visual feedback is the selling point and it's excellent. A scope and spectrum after every stage, a Response Curve over the Filter's spectrum, and a Timeline showing both envelopes and the Effective Cutoff live. *Learning Synths* shows one waveform. This shows the whole signal chain.
- The Filter behaves at high Resonance: it rings, keeps its bass, and doesn't run away in level or hiss at high Cutoff.
- Envelopes are fast (about 1 ms at the minimum), and the ranges are generous (up to 10 s, ±5 oct of envelope).
- Mono Glide with last-note priority works as on a Minimoog.
- The Acid, Reese, Wobble and Screamer Presets are set up the way a synth player would set them up.
- MIDI Learn is quick and clear, with Pickup, and the mappings survive a reload. The controller was found with no setup.
- Save and the share link work in two clicks, with a nice "Play the shared sound" for whoever opens the link.

## Where they got stuck or gave up

- **A chord on Pad came out as one note.** Most Pads and most Keys are set to 1 Voice. I worked it out from the Voices row, but I wouldn't expect it from a Preset called "Pad" or "Electric Piano".
- **Pitch bend, the sustain pedal and program change are ignored, and the mod wheel is dead until mapped.** Pitch bend can't even be mapped. This was the moment I felt "this is a teaching tool, not an instrument".
- **The Glide knob is slow at the start.** I dragged it a fair way and got 6 ms, which you can't hear. I had to drag much further to get a real slide.
- **Ambiguous names in the mapping list** ("Amount", "Depth"). With four or five mappings, I couldn't tell them apart.
- **The share link drops the name.** My friend would see "Shared Patch", not "Fat Saw Bass".
- **What's missing that every synth has** (feature gaps, not bugs):
  - pitch bend, and a mod wheel and sustain pedal that work out of the box
  - effects: no reverb, delay or chorus, so I'd expect the pads to sound dry (not verified by ear)
  - oscillator sync, unison and spread
  - tempo sync for the LFOs, and an Amp (tremolo) destination
  - a master volume knob
  - the mouse wheel on the knobs

## Would they

- **Like it: yes.** The filter and envelopes are well judged, the Presets have real sounds among the teaching ones, and seeing every stage is genuinely new.
- **Share it: yes,** with the caveat "it's a visual synth, not a VST replacement". The share link works and opens on a "Play the shared sound" button.
- **Come back: probably yes,** to show someone how a filter envelope works, or to sketch a patch idea. Not to write music: no pitch bend, no sustain pedal, no effects.
- **Recommend it: yes,** to anyone learning synthesis or teaching it, ahead of *Learning Synths* for depth. Not as a performance instrument.

## Three findings, ranked

1. MIDI keyboards: pitch bend, the sustain pedal (CC 64) and program change are ignored, the mod wheel does nothing until mapped, and MIDI Learn can't map pitch bend (the bar still asks to "move a knob, fader or pad"). `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/2-synth-enthusiast/21-learn-pitchbend.png`
2. Presets: 7 of the 9 Pads (Pad, PWM Strings, Warm Pad, Brass Swell, Choir, Sweep Pad, Dark Drone) and Organ, Electric Piano, Marimba, Glass Keys, Harp and Clav are set to 1 Voice, so a chord plays one note. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/2-synth-enthusiast/p-Pad.png`
3. MIDI panel: the Mappings list names a Parameter without its section ("Amount" for the Filter Envelope Amount, "Depth" for LFO 2 Depth), so mappings to same-named controls can't be told apart. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/2-synth-enthusiast/19-midi-panel-after.png`

Also seen, lower priority:
- The share link carries no Patch name: it opens as "Shared Patch".
- The Glide knob covers Off to 6 ms in its first 40 px of travel.
- The mouse wheel doesn't turn knobs.
- Quick Setup starts at "Osc 2 · Detune" rather than Cutoff.
