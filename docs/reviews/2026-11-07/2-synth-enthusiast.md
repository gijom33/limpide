# Persona review 2: the synth enthusiast

Ran on version 1.26.1 (build 38df0ad), on 2026-11-07, on the live site.

Laptop, 1440 × 900, Chromium (headless, Playwright), 15 minutes. I had no real MIDI keyboard. A stand-in "Arturia KeyStep 37" was injected into the page as a fake Web MIDI input, sending notes, velocity, CCs, pitch bend, the sustain pedal and relative-encoder messages.

I could not listen. I judged sound by tapping the page's audio output and measuring:

- peak and RMS level
- clipped samples
- the steepest step between samples
- the envelope, in 5 to 250 ms windows

Screenshots are in `/private/tmp/rev2-1107/`. I read the earlier reports only after forming my first impression.

## First impression

"A welcome card: 'a synthesizer you can see through', Play the Demo or Take the Tour. I hit Esc to get to the panel, which is laid out like a real synth: Oscillators with four tabs, a Filter with four modes and 12/24 dB, an Amp with 1 to 8 Voices, Legato and Glide, and two LFOs. Every section has its own scope and spectrum. That's more than *Learning Synths* shows. One odd thing: after Esc, focus landed on the Demo button, and a 13-line tooltip covered half the Amp section until I moved on." (`first.png`, `main.png`)

## What they tried

1. **The Preset menu.** It has about 150 Presets in 15 rows, plus 9 Tutorials, a search box, category filters, My Patches, Export, Import and a share link. "That's a proper library." (`presets.png`)
2. **The MIDI keyboard.** The MIDI button found the KeyStep straight away and said its keys play with Velocity. (`midi-panel.png`)
   - Velocity 100 against 20 gave a 14 dB difference.
   - Last Message showed each event: Note, CC 1, CC 74, and pitch bend at +98 %.
   - The sustain pedal held a released Note, and it stopped when the pedal lifted.
   - The mod wheel turned up LFO 1 Depth (50 % at CC 64). The one-line description under the Patch name changed to "a saw, softly filtered, sustained, with a wobble", and Init showed its "changed" dot. (`learn1.png`)
3. **MIDI Learn.** I clicked Resonance and turned a knob.
   - The bar said "Resonance: keep turning…", then mapped it.
   - A relative encoder (repeated 65s) on Amp Decay was recognised as Relative on its own.
   - The Mappings list shows each mapping's full name, channel, CC, and an Absolute/Relative switch. (`mappings.png`)
   - Mappings survived a reload.
   - Quick Setup walks through 28 controls one by one. (`quicksetup.png`)
   - Pickup is standard soft takeover: a mapped knob only catches up once the hardware knob crosses its value. (Step 7 has more.)
4. **Every Preset, then a chord on 28 chosen ones.**
   - Peaks ran from 0.11 to 0.50 of full scale, with nothing clipped.
   - Pads swell (660 to 875 ms to the peak). Plucks, Acid and leads hit in 5 to 15 ms.
   - **Vowel** is the outlier: peak 0.04 to 0.06 at C3, C4 and C5, about 15 dB below its neighbours (Talking Filter 0.15). Its Volume knob is set to 10 %. (`p-Vowel.png`)
   - The first full walk through the menu showed Vowel just as quiet (0.061).
5. **The Filter at full Resonance (issue 41).** On Init I held C3 and swept the Cutoff with a mapped CC from 20 kHz down to 20 Hz and back up, in both slopes.
   - The peak rose from 0.29 to 0.93 (12 dB) and to 0.96 (24 dB) as the resonant peak crossed the fundamental and low Harmonics. That is about +10 dB, near full scale, and not one clipped sample.
   - Resonance at 70 % peaked at 0.45.
   - "It whistles across the Harmonics the way a resonant low-pass should, and it never breaks up." I can't tell whether it sounds sweet; the level never hits a wall.
6. **A sound of my own from Init, with the mouse.**
   - Osc 2 a saw detuned +6 ¢ at 79 %, the Sub one octave down at 33 %.
   - 24 dB, Cutoff 252 Hz, Resonance 33 %, Envelope Amount +2 oct, Filter Sustain 0.
   - Amp Attack 1 ms, Glide 32 ms.
   - The description line wrote "two detuned saws with a Sub, muffled, opening on each Note, sustained". "That is exactly what I made." (`own-sound.png`)
   - An eight-note bass line peaked at 0.59, with no clipping.
   - I saved it as "Fat Saw Bass" and copied the share link. In a fresh browser the link opened "Fat Saw Bass" with "Play the shared sound" and the same Cutoff and Resonance. (`friend.png`)
7. **Pickup, looked at closely.** I mapped Resonance, set it to 90 % with the mouse, then turned the hardware knob from 40 to 70.
   - The knob stayed at 90 %, which is correct.
   - Nothing on the panel shows where the hardware knob is, or that it is waiting. (`pickup-waiting.png`)
8. **The LFOs.**
   - LFO Sync is new. It steps through 1/4, 1/8 D, 1/4 T, 1/8 … 1/32 T at the BPM. There is a Retrig button, five shapes, and eight Destinations. (`lfo-sync.png`)
   - The Display menu has Freeze, Snapshot, Log or Lin axes, Cycles, an Env Timeline, and the Harmonics, Ideal, Filter, Guides and Geek overlays. (`display.png`)
9. **The Demo, 20 seconds.** Peak 0.34, nothing clipped.

## What worked

- MIDI is complete for a hobby setup:
  - velocity, pitch bend (2, 7 or 12 st), the sustain pedal and the mod wheel
  - Learn, with absolute and relative encoders detected on their own
  - soft takeover, a 28-step Quick Setup, and mappings that persist
- The auto description of the current Patch is a small delight. It reads like a sound designer's note.
- Levels are disciplined. Across 28 Presets, my own sound, full Resonance and the Demo, I found no clipped sample.
- LFO tempo Sync, with dotted and triplet values, closes one of my "every synth has it" gaps from last time.
- The share link round-trips the Patch and its name, and greets the friend with "Play the shared sound".

## Where they got stuck or gave up

- **Vowel looks broken** when you flip through Presets on a controller: it is about 15 dB quieter than everything around it, because its Volume is 10 %.
- **Pickup is silent.** I turned my knob and nothing happened, and nothing on screen said why. I know soft takeover, so I guessed. A newer player would think the mapping failed.
- **Closing the welcome with Esc** put focus on the Demo button, and its long tooltip sat over the Amp section until I clicked elsewhere. Seen on the first visit only. Closing with × also focused Demo, but no tooltip showed.
- **Still missing compared with every synth:**
  - effects (no chorus, delay or reverb)
  - unison and spread
  - true hard sync (there is "Sync-ish Lead", which says it only hints at it)

  These are v2 material and already known; noted, not ranked.

## Would they

- **Like it: yes.** The panel is a real subtractive synth with FM, Ring and Poly Mod, and the Viewers explain every stage.
- **Share it: yes.** "Map your controller in 30 seconds, then sweep the Cutoff and watch the bump ride the Harmonics." The share link makes it easy.
- **Come back: yes,** to sketch patches and show friends how a filter works. Not to record with: there are no effects or unison.
- **Recommend it: yes,** ahead of *Learning Synths* for learning, because it has MIDI Learn, FM, ring mod, tempo-synced LFOs and Presets you can save and share.

## Since the last run (1.16.0, 2026-10-30)

- **Fixed:**
  - Notes played into a Release no longer jump. On a sine, C3 released, then D3 50 ms later and D3 again: the steepest step at each onset was 1.4× the steady wave's, which is the pitch change and nothing more. Last time it was 16×. This was measured from a live capture, not an offline render.
  - The mouse wheel turns Osc 1's Octave: three notches went to +2 oct.
- **New and good:**
  - LFO tempo Sync and Retrig
  - Quick Setup at 28 steps
  - the live Patch description line
- **Not right yet:**
  - Pickup still gives no cue (my 1.16.0 note).
  - Vowel's level.
- **Not retested:** FM aliasing on rich waveforms at the top octaves.
- **Still missing:** effects, unison, hard sync.

## Three findings, ranked

1. The Vowel Preset is about 15 dB quieter than its neighbours: peak 0.04 to 0.06 at C3, C4 and C5, against 0.11 to 0.50 across 28 Presets. Its Volume is 10 %, so it sounds broken when you step through Presets. `/private/tmp/rev2-1107/p-Vowel.png`
2. MIDI Pickup gives no cue. A mapped knob waiting for the hardware knob to cross its value (Resonance at 90 %, hardware turned 40 to 70) shows no ghost position and no "waiting" state, so the mapping looks dead. This was already noted on 1.16.0. `/private/tmp/rev2-1107/pickup-waiting.png`
3. Closing the first-visit welcome with Esc moves focus to the Demo button, whose 13-line tooltip then covers the Amp section until you click elsewhere. `/private/tmp/rev2-1107/main.png`
