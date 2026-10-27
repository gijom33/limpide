# Knob size follows the Parameter's role

**Status:** accepted · **Date:** 2026-10-24 · **Decided by:** the owner

Supersedes issue 15's rule "every knob on the page is one size".

Each Parameter has a role. **Play** Parameters are worth turning while music is playing and get the big knob (68 px; 60 px on phones, 52 px on compact laptop windows): Cutoff, Resonance, Envelope Amount, LFO Rate, LFO Depth and Detune. **Set-and-forget** Parameters are chosen once and left alone and get the small knob (52 px; 40 px on compact laptop windows): Pulse Width, Octave, Semitone, Velocity, Key Track and Glide. Pulse Width was first a play Parameter; in the prototype (issue 18) the owner moved it, as it is not that commonly used. Levels (the Mixer) and envelope stages (both ADSRs) are not knobs at all but vertical faders, one size.

The role belongs to the Parameter definition, next to its unit and Taper, so a knob's size never depends on the block it happens to sit in, and the phone layout, the desktop layout and any future one agree.

## Why

One size made every row look the same, so nothing told a newcomer where to put their hands: Cutoff weighed as much as Key Track. Fitts's law says the controls used most should be the easiest to hit; making them bigger is the cheapest way to do that and also makes the page's hierarchy visible ([design principles](../design-principles.md)). The play list started from the PRD's first C16 encoder layout (story 53 as it then read), the Parameters judged most worth having under the hands, less Waveform (a picker, not a knob) and Glide (set once for a Patch). The C16 layout that followed (ADR-0009) puts a section per bank, set-and-forget Parameters included; the roles here are the page's, not the Controller's.

## Considered Options

- **Keep one size:** consistent, but it reads as a spreadsheet of knobs and wastes room on set-and-forget controls.
- **Size by block** (e.g. everything in the Filter is big): easy, but it makes Key Track as big as Cutoff and Detune as small as Octave.
- **Three or more sizes:** finer, but sizes stop being recognisable at a glance; two knob sizes and one fader size are the most the eye sorts without thinking.

## Consequences

- Issue 15's knob pitch rule is replaced by a spacing rule: each control's column is as wide as its dial or its text, whichever is wider, and no two controls are closer than 8 px. A row that mixes sizes lines its dials up by their bottoms, so the labels share one line.
- The no-scroll promise at 1440×900 and 1710×1060 stays; the small knobs and the faders pay for the big knobs.
- MIDI Learn, tooltips and Pickup don't change: they are about Parameters, not sizes.
