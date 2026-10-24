# Knob size follows the Parameter's role

Supersedes issue 15's rule "every knob on the page is one size".

Each Parameter has a role. **Play** Parameters are worth turning while music is playing and get the big knob: Cutoff, Resonance, Envelope Amount, LFO Rate, LFO Depth, Detune and Pulse Width. **Set-and-forget** Parameters are chosen once and left alone and get the small knob, smaller than today's: Octave, Semitone, Velocity, Key Track and Glide. Levels (the Mixer) and envelope stages (both ADSRs) are not knobs at all but vertical faders, one size.

The role belongs to the Parameter definition, next to its unit and Taper, so a knob's size never depends on the block it happens to sit in, and the phone layout, the desktop layout and any future one agree.

## Why

One size made every row look the same, so nothing told a newcomer where to put their hands: Cutoff weighed as much as Key Track. Fitts's law says the controls used most should be the easiest to hit; making them bigger is the cheapest way to do that and also makes the page's hierarchy visible ([design principles](../design-principles.md)). The play list is close to the PRD's C16 encoder layout (story 53), the Parameters already judged most worth having under the hands; Waveform is a picker, not a knob, and Glide is set once for a Patch.

## Considered Options

- **Keep one size:** consistent, but it reads as a spreadsheet of knobs and wastes room on set-and-forget controls.
- **Size by block** (e.g. everything in the Filter is big): easy, but it makes Key Track as big as Cutoff and Detune as small as Octave.
- **Three or more sizes:** finer, but sizes stop being recognisable at a glance; two knob sizes and one fader size are the most the eye sorts without thinking.

## Consequences

- Issue 15's knob pitch rule becomes one pitch per knob size: within a row of one size, dials stay evenly spaced. A row that mixes sizes aligns its dials on a common centre line.
- The no-scroll promise at 1440×900 and 1710×1060 stays; the small knobs and the faders pay for the big knobs.
- MIDI Learn, tooltips and Pickup don't change: they are about Parameters, not sizes.
