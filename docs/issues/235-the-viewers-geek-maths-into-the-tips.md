# 235: The Viewers' geek maths into the tips

**What to build:** The owner's idea (inbox, 2026-11-05), for the next few days' polish: "I will be challenging the useless math added to the scope and spectrum viewer in geek mode. Those can go to the tips with a better explanation." What the Synth Geek Layer adds to the Viewers today ([170](./170-geek-numbers-viewers.md), [133](./133-the-maths-layer-complete.md)'s decision 11): each Scope's period and frequency in a corner ("3.82 ms · 261.6 Hz"), the Spectrum's hover readout's Harmonic number ("n = 3"), and the Oscillator Spectrum's Noise slope while the Noise is up. When 170 was tried the owner said "we will revisit the geek overlay via an agent later", and profile 19 of [42](./42-reviews.md), the synth geek, was added to judge every item the layer adds; it has not run yet. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-05). Built (2026-11-05) on day/2026-11-05, merged into main, released in 1.25.0; accepted by the owner: "OK with the rest of the tickets reviewed", with Claude's calls in it.

## Decisions

Decided by the owner, 2026-11-05: "For 235, the only thing Insuggested to transfer in tips is the extra mathematical formula which is added in geek mode, not the rest."

1. **Only the formulas move:** the Synth Geek Layer's formulas drawn on the Oscillator Spectrum (each Waveform's Harmonic series, FM's sidebands, Ring's sums and differences) and on the Filter Spectrum (the Filter's response) leave the Viewers for the tips.
2. **The rest stays as it is:** the Scopes' period and frequency, the Harmonic's number in the Spectrum's readout, the Noise's slope.

Claude's calls, let stand by the owner in 1.24.0:

3. **Each formula goes to the tip of the control it belongs to:** the Harmonic series to the Waveform's tip (Osc 1's and Osc 2's), FM's to FM's, Ring's to Ring's, the response to the Filter's Mode and Slope, in Under the hood, which shows as every Under the hood does today.
4. **A better explanation:** each formula comes after a plain sentence of what it says, and every letter in it is named ("n, the Harmonic's number; bₙ, its level against the first").
5. **The formula follows the settings,** as on the Viewer today: the tip gives the Waveform, Filter Mode and Slope picked now.

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, the formulas leave the Oscillator and Filter Spectrums and go into their controls' tips, each after a plain sentence and with every letter named.

**Current behavior:** With the Synth Geek Layer on, the Oscillator Spectrum draws the formulas for the Waveforms heard (and FM's and Ring's when on), and the Filter Spectrum the Filter's response formula. The Scopes' period, the Harmonic's number and the Noise slope are drawn too.

**Desired behavior:**
- No formula is drawn on any Viewer, whatever the layers.
- The Waveform's tip (each Oscillator's) gives the picked Waveform's Harmonic series in Under the hood; FM's and Ring's tips their own; the Filter's Mode and Slope tips the response for the Mode and Slope picked.
- Each such formula comes after a plain sentence saying what it means, and names each letter.
- The Scopes' period and frequency, the Spectrum readout's Harmonic number and the Noise slope are unchanged.
- The tests that read the formulas on the Viewers read them in the tips instead.

**Out of scope:** the controls' own geek readouts, History, profile 19's review of the rest of the layer.

## How it was built

No Viewer draws a formula any more, whatever the layers: the row the Synth Geek Layer added under the Viewers for them is gone, so the Viewers keep the size they have with the layer off. The Scopes' period and frequency, the Harmonic's number in the Spectrum's readout and the Noise's slope are as they were. With the layer on, each formula is in a tip's Under the hood, as the other tips' are: a plain sentence of what it says, then the formula, then each letter named, worked out for the settings picked.

- **Each Waveform's tip** (Osc 1's and Osc 2's) gives the picked Waveform's Harmonic series ("A Square has the odd Harmonics only, each its number times quieter than the first…"); a Pulse's tip works out its gaps at its width ("d: the Pulse Width, 25 % now: every 4th Harmonic missing").
- **Ring's tip** (its Mixer fader) gives the sums and differences, with the first pair for the knobs ("at 1.38 and 3.38 × f₁ now").
- **The Filter Mode's and the Slope's tips** give the Response Curve's formula for both as picked: what the Mode keeps in plain words, and at 24 dB that it is two Filters in a row, the gain squared.
- **FM's rule** gives β, J₀ to J₃ and where the partials land for the knobs, as on the Viewer before.
- The Synth Geek Layer's own tip and the glossary say where the formulas are now.

Claude's calls, let stand by the owner in 1.24.0:

1. **FM's formula is on the tip of Osc 1's "Pitch" heading, not FM's own** (amending decision 3). FM's tip was already the tallest (about 600 px on a 375 × 667 phone); with its formula it ran 200 px past the screen's foot, so its History line could not be read (the touch-tips test caught it). The Pitch heading sits over Octave and FM, and its tip already says what FM does. Putting it on FM's own would mean cutting FM's tip.
2. **The letters are named for a wave whose peak is 1:** bₙ is "its amplitude, the wave's peak being 1", which is what 2 / (π n) is, rather than "its level against the first".
3. **A Pulse's gaps are said up to the 20th Harmonic** ("every 4th Harmonic missing"); at a width like 33 % the first gap is the 100th, so only the general rule is given.
4. **The issue-188 layout test** that kept the formulas clear of the plots now checks that no formula is drawn by the Viewers and that they keep one size.

**To try:** switch Geek on in Display. The Spectrums show no formula any more. Then hover Osc 1's Waveform picker, pick Pulse and move Pulse Width; hover Osc 2's; hover "Pitch" on the Osc 1 tab and turn FM up; hover the Ring fader on the Mixer with Ring Bell loaded; hover the Filter Mode and the Slope and change them. On a phone, hold each of them.
