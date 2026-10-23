# Limpide

A monophonic subtractive synthesizer whose purpose is to make visible what each stage of the sound does. Every term below is about either the sound (the instrument) or the act of seeing it (the viewers).

## Language

### The instrument

**Patch**:
The complete set of parameter values that defines one sound.
_Avoid_: Preset (when you mean the user's sound), program, settings

**Preset**:
A read-only Patch shipped with the app, built to show off one idea (Init, Bass, Lead, Pluck, Pad, Wobble).

**Share link**:
A URL whose `#p=` part carries a Patch (only what differs from Init), so opening it plays that sound.
_Avoid_: Permalink, patch URL
_Avoid_: Factory patch, template

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
A source producing a periodic Waveform at a pitch. There are two, Osc 1 and Osc 2.
_Avoid_: VCO, generator

**Waveform**:
The shape of an Oscillator's cycle: sine, triangle, saw, square, or pulse.
_Avoid_: Wave type, shape

**Pulse Width**:
The fraction of a pulse Waveform's cycle spent high; 50% is a square.
_Avoid_: Duty cycle, PWM (PWM is pulse width being modulated)

**Transpose**:
Osc 2's offset from Osc 1 in whole Octaves and Semitones, before Detune.
_Avoid_: Interval, coarse tune

**Detune**:
Osc 2's fine pitch offset relative to Osc 1, in cents, on top of its Transpose.
_Avoid_: Fine tune, spread

**Noise**:
An unpitched source of equal energy across frequencies, mixed alongside the Oscillators.
_Avoid_: White noise generator, hiss

**Mixer**:
The stage setting the level of each source (Osc 1, Osc 2, Noise) before the Filter.
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
The Cutoff at a given instant after all modulation (Filter Envelope, LFO, Velocity) is applied.
_Avoid_: Current cutoff, modulated frequency

**Amp**:
The final stage controlling loudness over time.
_Avoid_: VCA, volume, gain

**Envelope**:
A one-shot Attack–Decay–Sustain–Release contour started by a Gate. There are two: the **Amp Envelope** and the **Filter Envelope**.
_Avoid_: ADSR (the shape, not the thing), EG, contour

**Envelope Amount**:
How far, in octaves, the Filter Envelope pushes the Effective Cutoff away from the Cutoff (may be negative).
_Avoid_: Env depth, intensity

**LFO**:
A slow, repeating modulation source that moves one Destination: pitch (vibrato), Cutoff, or Pulse Width (PWM). **Rate** is how fast it repeats, **Depth** how far it moves things.
_Avoid_: Modulator, wobble, LFO amount (say Depth)

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

**Note Priority**:
With one Voice, the rule picking which held Note sounds: last-note priority, so the newest held Note wins, and releasing it returns to the previous one. With more Voices, every held Note sounds, and a Note beyond the last free Voice takes the oldest one.
_Avoid_: Voice stealing

**Hold**:
A mode that keeps Notes sounding after their keys are released, so the sound sustains while you adjust Parameters: with one Voice until a new key or Hold off, with more until Hold off.
_Avoid_: Drone, latch, sustain (Sustain is an Envelope stage)

**Velocity**:
How hard a Note was struck (0–1): from MIDI, from how low you press an on-screen piano key, or full for the computer keyboard. It scales the Amp level and, by the **Velocity → Cutoff** amount, the Effective Cutoff.
_Avoid_: Intensity, force

**Sub-oscillator**:
A square wave an octave below Osc 1, following its pitch, with its own Mixer level. While it sounds, the fundamental is the Sub's pitch, so Harmonic Markers and Cycle Lock count from there.
_Avoid_: Sub, sub-bass (fine in UI copy)

**Key Track**:
How far the Effective Cutoff follows the Note played, measured from C4: at 100 % an octave per octave, so the Filter keeps the same Harmonics on every Note. It follows a Glide.
_Avoid_: Keyboard follow, key scaling

### Seeing

**Tap**:
A listening point in the Voice where the signal is observed: the **Oscillator Tap** (the Mixer's output), the **Filter Tap**, and the **Amp Tap** (before the master volume and the output's safety clipper).
_Avoid_: Probe, monitor, stage output

**Nominal Level**:
The Oscillator's peak level (0.5, i.e. −6 dB below full scale), drawn on every Scope as "Osc level". It leaves headroom for Resonance.
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
A label on the Spectrum identifying a Harmonic by number, frequency, and nearest note.
_Avoid_: Peak label

**Ideal Reference**:
The theoretical Harmonic levels of the current Waveform (e.g. 1/n for saw), drawn for comparison with what's measured.
_Avoid_: Expected spectrum, model curve

**Response Curve**:
The Filter's gain per frequency at the Effective Cutoff, drawn over the Spectrum.
_Avoid_: Filter curve, transfer function (maths layer only), EQ curve

**Envelope Timeline**:
A Viewer plotting both Envelopes and the Effective Cutoff over time, with a playhead at "now".
_Avoid_: ADSR display

**Freeze**:
Pausing all Viewers on their current frame while the sound keeps playing.
_Avoid_: Pause, hold (Hold is a playing mode)

**Snapshot**:
A captured Spectrum kept as a faint trace for A/B comparison against the live one.
_Avoid_: Reference trace, pin, compare

**Maths Layer**:
An optional overlay revealing the underlying quantities (Q, dB, formulas, frequencies) behind Parameters and Viewers.
_Avoid_: Advanced mode, expert mode

### Control surface

**Controller**:
A connected MIDI hardware device, such as the Synido TempoPAD C16.
_Avoid_: Device, MIDI keyboard

**Mapping**:
A link from one Controller control (a channel plus CC or note) to a Parameter or Action.
_Avoid_: Binding, assignment

**Action**:
A momentary command that is not a Parameter: toggle Hold, Freeze, take a Snapshot, next Preset.
_Avoid_: Command, shortcut

**MIDI Learn**:
The mode in which the next Controller message received becomes the Mapping for the selected Parameter or Action.
_Avoid_: Auto-map

**Quick Setup**:
A guided sequence of MIDI Learn steps that maps a whole Controller layout in one pass.
_Avoid_: Wizard (fine in UI copy), onboarding

**Encoder Mode**:
How a Controller knob reports movement. **Absolute** sends a position (0–127). **Relative** sends increments.
_Avoid_: Knob type

**Pickup**:
For Absolute Mappings, the rule that the Parameter ignores the knob until the knob passes through the Parameter's current value, so values never jump.
_Avoid_: Soft takeover, catch

**Activity Monitor**:
A small display of the most recent incoming MIDI message.
_Avoid_: MIDI log, MIDI console
