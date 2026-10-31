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
The fraction of a pulse Waveform's cycle spent high; 50% is a square.
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
How far Osc 2 swings Osc 1's frequency at audio rate (linear frequency modulation, or cross-modulation), whatever Osc 2's own Mixer level: new partials appear either side of Osc 1's Harmonics. High up, it is held back as far as keeps them under the top of what the browser plays.
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
_Avoid_: Q (that's the maths name; shown only in the maths layer), emphasis, peak

**Effective Cutoff**:
The Cutoff at a given instant after all modulation (Filter Envelope, LFOs, Velocity, Key Track) is applied.
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
A slow, repeating modulation source; there are two, each moving one Destination: Pitch (vibrato), Osc 2 Pitch, Detune, Pulse Width (PWM), FM, Cutoff, Resonance or Volume (tremolo). **Rate** is how fast it repeats, **Depth** how far it moves things.
_Avoid_: Modulator, wobble, LFO amount (say Depth)

**Retrigger**:
An LFO setting: on, the LFO starts its cycle again at every Note, where its Waveform classically starts: a Saw at its foot, a Saw Down at its top, a Square on its upper half, a Sine and a Triangle at the centre rising (each Note gets the same wobble from its start); off, it runs freely and each Note catches it wherever it is. Off by default.
_Avoid_: Key sync (fine in a tooltip), reset, phase reset

**Glide**:
The time taken to slide from one note's pitch to the next.
_Avoid_: Portamento, slide

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

**Hold**:
A mode that keeps Notes sounding after their keys are released, so the sound sustains while you adjust Parameters: with one Voice until a new key or Hold off, with more until Hold off, one Note per Voice at most (a Note beyond them lets the oldest go). Pressing the key of a Note Hold keeps lets that Note go; Hold stays on. The piano keeps their keys lit. Quick clicks on Hold after switching it on, before a Note is held, tap a rhythm: the held Notes then repeat on it, looping (on several Voices, the whole rhythm once as single Notes in turn, then once as the chord).
_Avoid_: Drone, latch, sustain (Sustain is an Envelope stage)

**Demo**:
An original track of about three minutes, played by the synth alone: each part is a Preset, loaded on the bar line, after a short breath, and the builds and drops are knobs turning. The page follows the knob being turned, until the person scrolls. Knobs and the stages' switches can be changed while it plays; a Note or any other control stops it.
_Avoid_: Autoplay, showcase, tour

**Welcome**:
About as a brand-new browser (no Last session, no saved Patches) sees it, once: it offers to play the Demo, or, opened from a Share link, a short riff on the shared Patch, or to explore alone.
_Avoid_: Onboarding, splash, intro

**Tutorial**:
A Preset rebuilt from Init in Steps, with the person turning each control. A card docked at the bottom of the page shows the current Step; nothing is locked, and the last card lists what differs from the Preset. Opened from the Preset's row or the Tutorials list in the Patches panel, or from the Welcome.
_Avoid_: Lesson, course, walkthrough, onboarding

**Step**:
One change in a Tutorial: one Parameter to a target (reached within 5 % of the control's travel, a choice exactly), or one Display option to switch on. It has an instruction, and a note on what to hear and see, shown once the change is made.
_Avoid_: Stage (an Envelope's), lesson

**Song**:
A house loop in C minor that plays on whatever Patch is loaded and never changes it, so the sound can be shaped under a tune. It only uses the 13 keys from the piano's C to the C above, and moves with the piano's octave. One Voice plays its chords as a single line. A Note, the Demo or the Song button stops it.
_Avoid_: Loop, backing track, sequence

**Mascot**:
A pixel water drop whose tail is the Limpide logo, called by playing C, A, D, E by hand and sent away the same way. It comes up from behind the Amp section, stands on its top edge and moves with what is heard; it makes no sound. Left out of the tips and the README on purpose.
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

**Tap**:
A listening point in the Voice where the signal is observed: the **Oscillator Tap** (the Mixer's output), the **Filter Tap**, and the **Amp Tap** (before the master volume and the output's safety clipper).
_Avoid_: Probe, monitor, stage output

**Nominal Level**:
The Oscillator's peak level (0.5, i.e. −6 dB below full scale), marked on every Scope by the Guides, when they are shown. It leaves headroom for Resonance.
_Avoid_: Unity, reference level, 0 dB

**Viewer**:
A visual display attached to a Tap. Kinds: Scope, Spectrum, Envelope Timeline.
_Avoid_: Visualiser, graph, panel

**Scope**:
A Viewer showing amplitude over time.
_Avoid_: Oscilloscope (fine in prose), waveform view

**Cycle Lock**:
The Scope behaviour that aligns the trace to the Note's period so it stands still, showing a chosen number of cycles (1, 2, 4).
_Avoid_: Trigger, sync, stabilisation

**Spectrum**:
A Viewer showing level per frequency at an instant.
_Avoid_: FFT, frequency view, analyser

**Harmonic**:
A frequency component at an integer multiple of the Note's fundamental. The fundamental is the 1st Harmonic.
_Avoid_: Partial, overtone (overtone numbering is off by one)

**Harmonic Marker**:
A label on the Spectrum identifying a Harmonic by number (the fundamental by its note); the hover readout adds its frequency and nearest note.
_Avoid_: Peak label

**Ideal Reference**:
The theoretical Harmonic levels of each Oscillator's Waveform (e.g. 1/n for saw) at its Mixer level, drawn for comparison with what's measured: a circle for Osc 1 (its FM sidebands too, while Osc 2 is a Sine or whole octaves from it), a square for Osc 2, a triangle for the Sub, each where its Harmonics fall; a diamond for each of Ring's sums and differences.
_Avoid_: Expected spectrum, model curve

**Response Curve**:
The Filter's gain per frequency at the Effective Cutoff, drawn over the Spectrum.
_Avoid_: Filter curve, transfer function (maths layer only), EQ curve

**Envelope Timeline**:
A Viewer plotting, over time with the present at its right edge, what changes the sound: the Amp Envelope always; the Filter Envelope while its Amount is set; the Effective Cutoff while the Filter Envelope or an LFO moves it; every other Destination an active LFO moves, on its knob's scale. A moved Parameter is a broken line in its stage's colour (the Cutoff dotted, what LFO 1 moves dashed, what LFO 2 alone moves dash-dotted). Its key lists what LFO 1 moves, what LFO 2 moves, the Cutoff, the Filter Envelope and the Amp Envelope, the Envelopes as Filter Env and Amp Env on screen.
_Avoid_: ADSR display

**Freeze**:
Pausing all Viewers on their current frame while the sound keeps playing.
_Avoid_: Pause, hold (Hold is a playing mode)

**Snapshot**:
A captured Scope and Spectrum trace, kept faint for A/B comparison against the live ones.
_Avoid_: Reference trace, pin, compare

**Maths Layer**:
An optional overlay revealing the underlying quantities behind Parameters and Viewers: Resonance as Q, levels in dB, the Harmonic formula of Osc 1's Waveform, the Response Curve's formula, and the Effective Cutoff's value. Switched on in the Display panel; off by default.
_Avoid_: Advanced mode, expert mode

### Control surface

**Controller**:
A connected MIDI hardware device, such as the Synido TempoPAD C16.
_Avoid_: Device, MIDI keyboard

**Mapping**:
A link from one Controller control (a channel plus CC or note) to a Parameter, a choice (a Waveform, the Filter Mode, Voices…) or an Action. A button acts on its press, or, if it is a **toggle button** (one value per press, each the other), on every message.
_Avoid_: Binding, assignment

**C16 layout**:
The one built-in set of Mappings, for the TempoPAD C16: each of its 4 banks plays one section, and its first buttons are the Actions on every bank. Applied by itself once, when a C16 is first plugged in with nothing mapped (ADR-0009).
_Avoid_: Preset (a Preset is a sound), default mapping

**Action**:
A momentary command that is not a Parameter: toggle Hold, Freeze, take a Snapshot, previous or next Preset.
_Avoid_: Command, shortcut

**MIDI Learn**:
The mode in which the next Controller message received becomes the Mapping for the selected Parameter, choice or Action.
_Avoid_: Auto-map

**Quick Setup**:
A guided sequence of MIDI Learn steps for any Controller: the Parameters played live and the Actions, in the page's order; set-once settings are left to MIDI Learn.
_Avoid_: Wizard (fine in UI copy), onboarding

**Encoder Mode**:
How a Controller knob reports movement. **Absolute** sends a position (0–127). **Relative** sends increments. Detected during MIDI Learn; a knob of the C16 layout finds it on its first turn.
_Avoid_: Knob type

**Pickup**:
For Absolute Mappings, the rule that the Parameter ignores the knob until the knob passes through the Parameter's current value, so values never jump.
_Avoid_: Soft takeover, catch

**Activity Monitor**:
A small display of the most recent incoming MIDI message.
_Avoid_: MIDI log, MIDI console
