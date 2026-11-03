# Limpide

A subtractive synthesizer, from one to eight Voices, whose purpose is to make visible what each stage of the sound does. Every term below is about either the sound (the instrument) or the act of seeing it (the viewers).

## Language

### The instrument

**Patch**:
The complete set of parameter values that defines one sound.
_Avoid_: Preset (when you mean the user's sound), program, settings

**Preset**:
A read-only Patch shipped with the app, built to show off one idea, in groups (Shapes, Filter, Bass, Pads…). The Patch panel offers the groups as its categories, beside All, the Tutorials and My Patches (issue 69). The lessons come first, then the sounds by family (issue 125). A Preset may start the keyboard in its own octave when loaded, the Basses on C2; the octave buttons move it after and write it into the Patch, so a saved Patch or a Share link keeps the octave last chosen (issue 126).
_Avoid_: Factory patch, template

**Share link**:
A URL whose `#p=` part carries a Patch (only what differs from Init), so opening it plays that sound.
_Avoid_: Permalink, patch URL

**Parameter**:
One named, bounded, user-adjustable value of a Patch (e.g. Cutoff), with a unit and a Taper.
_Avoid_: Knob, control, setting

**Taper**:
The curve mapping a control's 0–1 position to a Parameter's real value: linear, or logarithmic (equal travel per ratio, used for frequencies and times).
_Avoid_: Scaling, curve, response

**Grid**:
The round values a Parameter's control lands on for a press of an arrow key, a wheel's notch or a Relative knob's tick, in its own unit: a semitone of the Cutoff, the next round time of an Envelope stage (10, 11, 12, 14 ms…), 1 % of a level, 0.5 dB of a Mixer fader. Shift steps on a finer Grid, Page Up and Down a coarser one (an octave, double or half, 10 %, 6 dB). A drag or an Absolute knob sets any value; the next press lands on the Grid, and nothing stored is rounded to it. Each control's tip names its steps, where there is a keyboard (issue 160).
_Avoid_: Resolution, quantise, snap (fine in a tooltip)

**Voice**:
One sound-producing chain: Oscillators → Mixer → Filter → Amp. A Patch has one to eight; the Viewers show the one playing the newest Note (the Amp Tap, all of them, unless asked otherwise).
_Avoid_: Channel, synth

**Voices**:
How many Notes a Patch lets sound at once (1 to 8). At 1 the instrument is monophonic (Note Priority, Glide); at 2 to 8 each Note takes its own Voice and chords sound.
_Avoid_: Polyphony (the setting), voice count

**Oscillator**:
A source producing a periodic Waveform at a pitch. There are two, Osc 1 and Osc 2. Osc 1 sounds at the Note played, moved by whole octaves by its Octave; the Sub follows it.
_Avoid_: VCO, generator

**Waveform**:
The shape of an Oscillator's cycle: sine, triangle, saw, square, or pulse.
_Avoid_: Wave type, shape

**Pulse Width**:
The fraction of a pulse Waveform's cycle spent high; 50% is a square. It holds at whatever pitch the Oscillator sounds, however its tuning, Env Amount, an LFO, the bend or a Glide moves it.
_Avoid_: Duty cycle, PWM (PWM is pulse width being modulated)

**Transpose**:
Osc 2's offset from the Note played in whole Octaves and Semitones, before Detune.
_Avoid_: Interval, coarse tune

**Detune**:
Osc 2's fine pitch offset in cents, on top of its Transpose.
_Avoid_: Fine tune, spread

**Env Amount (Osc 2)**:
How many semitones the Filter Envelope moves Osc 2's pitch at its peak, up or down: the Envelope shapes the Cutoff and, by this Amount, Osc 2's tuning.
_Avoid_: Pitch envelope, Poly Mod (fine in a tooltip)

**Noise**:
An unpitched source mixed alongside the Oscillators, in one of two colours: white (equal energy at every frequency) or pink (equal energy in every octave, falling 3 dB an octave).
_Avoid_: White noise generator, hiss

**Ring**:
Osc 1 multiplied by Osc 2, a source in the Mixer of its own (Ring Modulation): it sounds at the sums and differences of their Harmonics, not at either pitch.
_Avoid_: Ring mod (fine in UI copy), AM

**FM**:
How far Osc 2 swings Osc 1's frequency at audio rate (linear frequency modulation, or cross-modulation), whatever Osc 2's own Mixer level: new partials appear either side of Osc 1's Harmonics. Its depth is set by the knobs: as Env Amount takes Osc 2 up, the swing stays and the index falls, as in analogue cross-modulation. High up, it is held back as far as keeps them under the top of what the browser plays.
_Avoid_: Cross Mod (fine in a tooltip), FM amount

**Mixer**:
The stage setting the level of each source (Osc 1, Osc 2, Ring, Noise, Sub) before the Filter.
_Avoid_: Levels, balance

**Filter**:
The stage that removes frequency content from the mixed signal. It is the "subtractive" in subtractive synthesis.
_Avoid_: VCF, EQ

**Filter Mode**:
Which region the Filter keeps: low-pass, high-pass, band-pass, or notch.
_Avoid_: Filter type

**Slope**:
How steeply the Filter attenuates beyond the Cutoff: 12 dB or 24 dB per octave.
_Avoid_: Poles, order, steepness

**Cutoff**:
The frequency at which the Filter starts to attenuate.
_Avoid_: Frequency (ambiguous), corner, brightness

**Resonance**:
Emphasis of the frequencies right around the Cutoff.
_Avoid_: Q (that's the maths name; shown only in the Synth Geek Layer), emphasis, peak

**Effective Cutoff**:
The Cutoff at a given instant after all modulation (Filter Envelope, LFOs, Velocity, Key Track, Aftertouch) is applied.
_Avoid_: Current cutoff, modulated frequency

**Amp**:
The final stage controlling loudness over time.
_Avoid_: VCA, gain

**Volume**:
The Amp's level, a knob right of its Envelope (100 % by default), and an LFO Destination: an LFO on Volume dips it from the knob's value, for tremolo, never above it; at full Depth the wave's foot is silence.
_Avoid_: the Amp itself (say Amp), level (a Mixer level), master volume

**Envelope**:
A one-shot Attack–Decay–Sustain–Release contour started by a Gate. There are two: the **Amp Envelope** and the **Filter Envelope**.
_Avoid_: ADSR (the shape, not the thing), EG, contour

**Envelope Amount**:
How far, in octaves, the Filter Envelope pushes the Effective Cutoff away from the Cutoff (may be negative).
_Avoid_: Env depth, intensity

**LFO**:
A slow, repeating modulation source; there are two, each moving one Destination: Pitch (vibrato), Osc 2 Pitch, Detune, Pulse Width (PWM), FM, Cutoff, Resonance or Volume (tremolo). **Rate** is how fast it repeats (in Hz, or with Sync on a note value), **Depth** how far it moves things.
_Avoid_: Modulator, wobble, LFO amount (say Depth)

**Retrigger**:
An LFO setting: on, the LFO starts its cycle again at every Note, where its Waveform classically starts: a Saw at its foot, a Saw Down at its top, a Square on its upper half, a Sine and a Triangle at the centre rising (each Note gets the same wobble from its start); off, it runs freely and each Note catches it wherever it is. A legato Note (Legato on) does not restart it. Off by default.
_Avoid_: Key sync (fine in a tooltip), reset, phase reset

**Sync**:
An LFO setting: on, its Rate is a **note value** at the Tempo, from 4 bars to 1/32, straight, dotted (D) or triplet (T), read as the note value alone ("1/8"), its Hz in the tip (issue 176), and running freely it starts its cycle on the beat; off, the Rate is in Hz again, as it was. Off by default (issue 112).
_Avoid_: Tempo sync (fine in a tooltip), BPM sync, clock sync

**Glide**:
The time taken to slide from one note's pitch to the next.
_Avoid_: Portamento, slide

**Legato**:
A switch by Glide, for one Voice: on, a Note played over a key still held changes the pitch alone, at once or over the Glide, and the Envelopes and the LFOs set to Retrigger carry on, with no new Attack; with every key up, even while Hold keeps the last Note, the next Note starts as any does. Off by default; with more Voices it has no effect (issue 119).
_Avoid_: Mono mode, legato glide, fingered portamento

### Playing

**Note**:
A pitch request with a Velocity, from any input (computer keyboard, on-screen piano, MIDI).
_Avoid_: Key, trigger

**Gate**:
The on/off state of a Voice. On while its Note is held (or Hold is on), off otherwise.
_Avoid_: Trigger, key down

**Dip**:
What a Note does to a Voice still sounding (in its Release, or taken while held) before it starts: 3 ms in a straight line down to silence, then the Oscillators restart and the Note starts, 3 ms late, so it starts the same way as a Note into silence, without a click (issue 102). A Note into silence, or a legato one, has none.
_Avoid_: Declick, fade (fine in a tooltip)

**Note Priority**:
With one Voice, the rule picking which held Note sounds: last-note priority, so the newest held Note wins, and releasing it returns to the previous one. With more Voices, every held Note sounds, and a Note beyond the last free Voice takes the oldest one.
_Avoid_: Voice stealing

**Tempo**:
The page's beats per minute, 40 to 240, 120 by default: never a Patch's, kept between visits, set by hand or with **Tap** (the BPM follows taps in time). An LFO with Sync on follows it. While the Demo, the Song, the Tour or a Tutorial plays, the Tempo is the player's own, its beats counted from its first Note, and the person's comes back when it stops (issue 112, ADR-0018). While a keyboard or a DAW sends a **MIDI clock** (24 ticks a beat), the Tempo is the clock's, its BPM read off the ticks and its beats theirs, a MIDI Start counting them again; it reads "MIDI" in place of "BPM" and cannot be set by hand until the ticks stop, when the last BPM stays, the person's again. A player still keeps its own while it plays (issue 136).
_Avoid_: BPM (the unit, fine on screen), clock, speed

**Hold**:
A mode that keeps Notes sounding after their keys are released, so the sound sustains while you adjust Parameters: with one Voice until a new key or Hold off, with more until Hold off, one Note per Voice at most (a Note beyond them lets the oldest go). Pressing the key of a Note Hold keeps lets that Note go; Hold stays on. The piano keeps their keys lit. Quick clicks on Hold after switching it on, before a Note is held, tap a rhythm: the held Notes then repeat on it, looping (on several Voices, the whole rhythm once as single Notes in turn, then once as the chord).
_Avoid_: Drone, latch, sustain (Sustain is an Envelope stage)

**Demo**:
An original track of about three minutes, played by the synth alone: each part is a Preset, loaded on the bar line, after a short breath, and the builds and drops are knobs turning. The page follows the knob being turned, until the person scrolls. Knobs and the stages' switches can be changed while it plays; a Note or any other control stops it.
_Avoid_: Autoplay, showcase, tour

**Welcome**:
About as a brand-new browser (no Last session, no saved Patches) sees it, once: it offers to play the Demo, or, opened from a Share link, a short riff on the shared Patch, the Tour, or to explore alone.
_Avoid_: Onboarding, splash, intro

**Tutorial**:
A Preset rebuilt from Init in Steps, with the person turning each control. A card docked at the bottom of the page shows the current Step; nothing is locked. The first card says, in the Tutorial's own words, what it teaches and what the person will hear; the last lists what differs from the Preset and names the next Tutorial (issue 129). Opened from the Preset's row or the Tutorials list in the Patches panel, the header's Tutorial button, or the Tour's last card.
_Avoid_: Lesson, course, walkthrough, onboarding, tour

**Tour**:
A first look at the instrument for someone who has never seen a synth: a card for each Section, in the signal's order (the Oscillators with the Mixer, the Filter, the Amp, the LFOs), says what to watch, then what the Section does, while the synth turns its main controls itself, on a plain Patch of its own, the person's Patch coming back when it ends. Each card waits for Next. Opened from the Welcome and the About, never from the Patches panel. Not a Tutorial: it rebuilds no Preset, and there is no Preset called Tour.
_Avoid_: Lesson, walkthrough, onboarding, intro, Tutorial

**Step**:
One change in a Tutorial: one Parameter to a target (reached within 5 % of the control's travel, a stepped one such as a note value on its step: issue 137; a choice exactly), or one Display option to switch on (one on already is switched off as its Step comes, and given back if the Tutorial is left before the person switches it on: issue 158). It has an instruction, and a note on what to hear and see, shown once the change is made.
_Avoid_: Stage (an Envelope's), lesson

**Song**:
A house loop in C minor that plays on whatever Patch is loaded and never changes it, so the sound can be shaped under a tune. It only uses the 13 keys from the piano's C to the C above, and moves with the piano's octave. One Voice plays its chords as a single line. A Note, the Demo or the Song button stops it.
_Avoid_: Loop, backing track, sequence

**Mascot**:
Bead: a pixel water drop whose tail is the Limpide logo, out on the page by default, coming in by itself a few seconds after the page opens; playing B, E, A, D by hand (as in a bead of water) sends it away and calls it back, for that visit only. In three and four across it lives on the top edge of the top right section; on a phone and in 2 × 2 it keeps in view as the page scrolls, on a section's edge in the right column or, with none in view, hovering on its whirling tail a little under the header where it lost ground (issue 142), falling like rain to a lower edge and flying up on its tail to a higher one. It never stands under a docked card, a tip or an open panel: it goes to an edge clear of them, or onto the card's top edge, and is still drawn under them (issue 164); where it rests, it covers no text (issue 181). It strolls and dances with the music, does funny turns when nothing is played, answers each knob and fader turned, giggles when tickled by the pointer and sprays droplets when clicked; sent away, it smashes itself down into a splash. While it is out, five more words spelled with Notes cue its tricks; it can be picked up and thrown; some controls change its look (its tail a Waveform a moment, a twin with Detune, an ice cube with the Filter closed); through the Demo it conducts, plays air guitar and surfs an LFO's plot, and outside it, now and then, rides the plot of a slow Sine or Triangle (issue 141). Display has a switch for it, the lasting setting, remembered; off, it never appears and the Notes do nothing. The Notes never turn the switch. It makes no sound. The README and the switch's tip say who it is; its tricks are left out of them on purpose, and everything it does is in [docs/bead.md](docs/bead.md). With the switch on, About shows it to the right of the name "Limpide", on the name's baseline, a click giving a card of its tricks (issues 163 and 178).
_Avoid_: Easter egg (the idea, not the thing), sprite, pet

**Velocity**:
How hard a Note was struck (0–1): from MIDI, from how low you press an on-screen piano key, or full for the computer keyboard. It scales the Amp level and, by the **Velocity → Cutoff** amount, the Effective Cutoff.
_Avoid_: Intensity, force

**Sub-oscillator**:
A square or sine wave one or two octaves below Osc 1 (its Sub Octave), following its pitch, with its own Mixer level. While it sounds, the fundamental is the Sub's pitch, so Harmonic Markers and Cycle Lock count from there.
_Avoid_: Sub, sub-bass (fine in UI copy)

**Key Track**:
How far the Effective Cutoff follows the Note played, measured from C4: at 100 % an octave per octave, so the Filter keeps the same Harmonics on every Note. It follows a Glide.
_Avoid_: Keyboard follow, key scaling

### Seeing

**Section**:
One of the page's four parts: the Voice's three stages, Oscillators (with the Mixer), Filter and Amp, each with the Viewers at its Tap, and the Envelope Timeline with the LFOs.
_Avoid_: Block, module

**Tap**:
A listening point in the Voice where the signal is observed: the **Oscillator Tap** (the Mixer's output), the **Filter Tap**, and the **Amp Tap** (before the master volume and the output's safety clipper).
_Avoid_: Probe, monitor, stage output

**Nominal Level**:
The Oscillator's peak level (0.5, i.e. −6 dB below full scale), leaving headroom for Resonance: where the Guides stand with one Oscillator at full.
_Avoid_: Unity, reference level, 0 dB

**Viewer**:
A visual display attached to a Tap. Kinds: Scope, Spectrum, Envelope Timeline.
_Avoid_: Visualiser, graph, panel

**Scope**:
A Viewer showing amplitude over time.
_Avoid_: Oscilloscope (fine in prose), waveform view

**Guides**:
Dashed lines on every Scope, when they are shown, at the level the Mixer sends: its sources' levels added, up to full scale (the Nominal Level with one Oscillator at full). A trace inside them has only lost energy; one beyond them has been boosted by Resonance.
_Avoid_: Reference lines, headroom lines

**Cycle Lock**:
The Scope behaviour that aligns the trace to the Note's period so it stands still, showing a chosen number of cycles (1, 2, 4): it starts on a rising zero of the fundamental, following the pitch the engine plays (vibrato, Glide, the bend), draws the newest sound, and of the starts one cycle apart takes the one most like the trace before, never older (issue 180).
_Avoid_: Trigger, sync, stabilisation

**Glow**:
A Display choice, Off by default: each Scope's trace fades over a few frames, as on an analogue oscilloscope, so what moves leaves a soft glow of the last quarter of a second, halving every 70 ms or so (issue 180).
_Avoid_: Phosphor, persistence, trails, averaging

**Spectrum**:
A Viewer showing level per frequency at an instant.
_Avoid_: FFT, frequency view, analyser

**Harmonic**:
A frequency component at an integer multiple of the Note's fundamental. The fundamental is the 1st Harmonic. To a newcomer, the stack of pitches a Note is made of; on a Spectrum, each Harmonic is a line (issue 129).
_Avoid_: Partial, overtone (overtone numbering is off by one), rung, spike, bar

**Harmonic Marker**:
A label on the Spectrum identifying a Harmonic by number (the fundamental by its note); the hover readout adds its frequency and nearest note.
_Avoid_: Peak label

**Ideal Reference**:
The theoretical Harmonic levels of each Oscillator's Waveform (e.g. 1/n for saw) at its Mixer level, drawn for comparison with what's measured: a circle for Osc 1 (its FM sidebands too, while Osc 2 is a Sine or whole octaves from it), a square for Osc 2, a triangle for the Sub, each where its Harmonics fall; a diamond for each of Ring's sums and differences. While a Note is held, Osc 2's, Ring's and FM's marks count from where the Filter Envelope's Sustain keeps Osc 2 (Env Amount × Sustain off its knobs).
_Avoid_: Expected spectrum, model curve

**Response Curve**:
The Filter's gain per frequency at the Effective Cutoff, drawn over the Spectrum. Switched on by Display's Filter toggle (issue 161), the line keeping its name.
_Avoid_: Filter curve, transfer function (Synth Geek Layer only), EQ curve

**Envelope Timeline**:
A Viewer plotting, over time with the present at its right edge, what changes the sound: the Amp Envelope always; the Filter Envelope while its Amount is set; the Effective Cutoff while the Filter Envelope or an LFO moves it; every other Destination an active LFO moves, on its knob's scale. A moved Parameter is a broken line in its stage's colour (the Cutoff dotted, what LFO 1 moves dashed, what LFO 2 alone moves dash-dotted). Its key lists what LFO 1 moves, what LFO 2 moves, the Cutoff, the Filter Envelope and the Amp Envelope, the Envelopes as Filter Env and Amp Env on screen, each name shorter still where the key's room runs short (Short forms, below). While an LFO is synced with Retrigger off, its cycle following the beat, faint broken lines mark the Tempo's beats, as on that LFO's plot.
_Avoid_: ADSR display

**Freeze**:
Pausing all Viewers on their current frame while the sound keeps playing.
_Avoid_: Pause, hold (Hold is a playing mode)

**Snapshot**:
A captured Scope and Spectrum trace, kept faint for A/B comparison against the live ones. One a Tutorial's Step took is cleared when that Tutorial ends or is left, unless the person has taken another since (issue 158).
_Avoid_: Reference trace, pin, compare

**Synth Geek Layer**:
An optional overlay revealing the underlying quantities behind Parameters and Viewers: Resonance as Q, levels in dB, the Harmonic formula of Osc 1's Waveform (FM's sidebands and Ring's sums and differences when they are up), the Response Curve's formula, the Effective Cutoff's value, and Osc 2's tuning as the engine plays it (the Octave's and Semitone's multiples, Detune's beats in Hz at the last Note played, A4 before any: issue 167), each LFO's period and its swing in its Destination's unit, the Cutoff at the Note under Key Track (issue 169), and on the Viewers each Scope's period and frequency, the Harmonic's number in a Spectrum's hover readout and the Noise's slope on the Oscillator Spectrum (issue 170). Switched on by Display's Geek toggle, a pair of glasses; off by default. It also adds to a control's tip its formula, under "Under the hood", and its History last; an Envelope fader's and Glide's work out their curve's time constant τ at their setting (issue 168). Named the Maths Layer until issue 165.
_Avoid_: Maths Layer (its old name), Advanced mode, expert mode

**History**:
The line a tip ends with while the Synth Geek Layer is on: where the control comes from, one sentence naming the instruments and people it came through (the Minimoog's "Emphasis" for Resonance), every fact sourced at grade A or B in issue 134's research file, which About links as "History's sources" (issue 134). Controls with no musical past (Freeze, Snapshot, Theme, Demo, the C16's) have none.
_Avoid_: geekiness, trivia, fun facts

### Control surface

**Controller**:
A connected MIDI hardware device, such as the Synido TempoPAD C16. A **known Controller** is one Limpide recognises by the name it gives and has a built-in layout for: the C16, for now (issue 149).
_Avoid_: Device, MIDI keyboard

**Mapping**:
A link from one Controller control (a channel plus CC or note) to a Parameter, a choice (a Waveform, the Filter Mode, Voices…), an Action or the Tempo (issue 112). A **momentary button** (127 pressed, 0 let go) acts on its press; a **toggle button** (one value per press, each the other) on every message. The C16 layout's Mappings answer a C16 only; any other answers every Controller.
_Avoid_: Binding, assignment

**C16 layout**:
The one built-in set of Mappings, for the TempoPAD C16: each of its 4 banks plays one section, each strip of its panel (two knobs, a fader, the M, S and R buttons) a column of that section, and M1–M4 and S3 are the same Actions on every bank. Its knobs are set to Relative #1 and its buttons as its printed card says. Applied by itself when a C16 is first plugged in with nothing mapped (ADR-0009, ADR-0017).
_Avoid_: Preset (a Preset is a sound), default mapping

**Action**:
A momentary command that is not a Parameter: toggle Hold, Freeze, take a Snapshot, previous or next Preset, Tap.
_Avoid_: Command, shortcut

**MIDI Learn**:
The mode in which the next Controller message received becomes the Mapping for the selected Parameter, choice or Action. A button learned on an Action is heard out for half a second: a second message in that time (its release) makes it momentary; one message alone, whatever its value, a toggle (issue 147).
_Avoid_: Auto-map

**Quick Setup**:
A guided sequence of MIDI Learn steps for any Controller: the Parameters played live and the Actions, in the page's order; set-once settings are left to MIDI Learn.
_Avoid_: Wizard (fine in UI copy), onboarding

**Encoder Mode**:
How a Controller knob reports movement. **Absolute** sends a position (0–127): on a Parameter centred on zero (Detune, the Filter's Amount), 64 is exactly zero, 0 to 64 its lower half and 64 to 127 its upper. **Relative** sends increments, each a step of the Parameter's Grid (a C16's fast 66 a third of one). Detected during MIDI Learn, and changed by hand in the MIDI panel where the guess is wrong (issue 186); the C16 layout's knobs are declared Relative (ADR-0017).
_Avoid_: Knob type

**Pickup**:
For Absolute Mappings, the rule that the Parameter ignores the knob until the knob passes through the Parameter's current value, so values never jump.
_Avoid_: Soft takeover, catch

**Activity Monitor**:
A small display of the most recent incoming MIDI message.
_Avoid_: MIDI log, MIDI console

**Aftertouch**:
A keyboard's pressure on its held keys (0 to 1), one for the whole keyboard: pressing a held key harder raises one Destination, chosen in the MIDI panel (the Cutoff by default), from its knob's value at no pressure to as far as one LFO at full Depth takes it at full, on top of the knob and the LFOs (issue 132). Kept with the MIDI settings, not in the Patch. A keyboard sends it for all its keys at once (channel aftertouch) or for each key or pad (polyphonic, or per-Note, aftertouch): the pressure used is the hardest-pressed held Note's, or the channel's if higher, a Note's forgotten on its release, and it moves the one Destination for every Note (the owner, 2026-11-01). Per-Voice pressure and MPE are not used.
_Avoid_: Pressure (fine in code), channel pressure

### Short forms

A label, a key or a button's word that would take a second line shows a shorter form instead, chosen by the room it has: an abbreviation, at worst a few letters (the design principles' "One line, shorter words", issue 156). The full name above stays its tooltip and what a screen reader hears; sentences wrap as text does.

| Name | Shorter forms, by step |
| --- | --- |
| Filter Envelope | Filter Env, F Env, FE |
| Amp Envelope | Amp Env, A Env, AE |
| Osc 2 Pitch | O2 Pitch, O2P |
| Pulse Width | PW |
| Detune | Det |
| Cutoff | Cut |
| Resonance | Res |
| Volume | Vol |
| Keys & Organs | Keys & Org, Keys |
| Plucks & Mallets | Plucks |
| Strings, Brass & Choir | Str & Brass, Strings |
| Movement & Effects | Move & FX, FX |
| Learning (the MIDI button's word during MIDI Learn) | Learn, Lrn |

The Envelopes are Filter Env and Amp Env on screen wherever they fit (the owner, 2026-10-28). A form shows only where a shorter label is needed: the Timeline's key, an LFO's Destination picker, the Patches panel's group names.
