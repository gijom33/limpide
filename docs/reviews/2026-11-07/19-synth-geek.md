# Review 19: the synth geek, on the Synth Geek Layer

Profile 19's first run, on the published site (1.26.1, build `38df0ad`), 2026-11-07. Driven from Node scripts with the repository's Playwright 1.64.1: Chromium at 1440 × 900, WebKit at 375 × 812 (touch). The Geek toggle was clicked on in Display, and every readout was read with the layer off and on. Every tip was hovered for its Under the hood and its History. One claim was checked against the sound: Detune's beats, rendered offline through the engine (A4, two saws, Cutoff at 8 kHz) from a temporary test, since deleted. The beat rate was measured from the envelope of the partials that coincide. The other formulas were checked against the engine's code (filterDesign, envelope, modulationModel, the FM gain).

## First impression

I opened Display and switched on the glasses. Six knobs and faders changed what they read: Resonance became Q 1.32, the Amp's Sustain −3.1 dB, Volume 0.0 dB, Key Track 2.00 kHz, the LFO Depths ±0.00 oct and ±0.00 st. Each Scope gained "2.27 ms · 440 Hz at A4" in its corner. That is a good start. Then I hovered and found the real content, the Under the hood paragraphs. The Harmonic series are right to the factor, the Bessel sidebands are right, and so is the biquad's |H| with an honest note on the bilinear warp. So is τ = stage ÷ 3, 4 or 6. This is better maths than most synth manuals carry. Two things nagged within a minute. Key Track read the same 2.00 kHz as the Cutoff. And the Detune readout's beats did not match what I expected for Osc 2 an octave down.

## What I tried, in order

1. **Off/on diff** at 1440 px: six readouts change, plus the three Scope corners. Both Sustains and the Volume changed as expected, except that the Filter Envelope's Sustain stays in % (right: it is a share of the Amount, not a gain).
2. **Every tip, hovered** (64 tips): the ones with Under the hood are Waveform, Osc 1's Pitch heading (FM), Filter Mode, Slope, Key Track, the six Envelope stages (no Sustain), Glide, the LFO's Depth and Rate, Osc 2's Octave, Semitone and Detune, the Noise colour, the Noise and Ring faders, the three Scopes and the three Spectrums.
3. **Checked by hand** against the engine: Q at 20 % (−3.01 + 0.2 × 27 = 2.39 dB, so 10^(2.39/20) = 1.32 ✓). At 100 %, Q 15.8; at 24 dB, Q 3.98 ×2; band-pass 24, Q 20.0 ×2 and Q 0.50 ×2 at 0 ✓. Sustain 70 % is −3.1 dB ✓. Key Track 50 % after C6 reads 4.00 kHz ✓. Semitone +7 reads ×1.498 ✓. Attack τ = 1.67 ms, Decay 62.5 ms, Release 66.7 ms ✓. The analogue and digital low-pass at 2 kHz and 16 kHz: −36.1 and −44.8 dB at 48 kHz ✓ (−47.2 dB at 44.1 kHz, a rate many Macs run at).
4. **The Viewers**: with A4 held, Osc 1 down an octave and the Sub up, every Scope read "9.09 ms · 110 Hz" ✓. Hovering the Spectrum's 2nd Harmonic gave "880 Hz · A5 · −31 dB · n = 2" ✓. With the Noise up and Pink chosen, "pink: −3 dB/oct" appeared top right ✓.
5. **Mixer tab**: Osc 1 0.0 dB, Osc 2 −∞ dB, Noise −∞ dB, Sub −∞ dB, **Ring 0 %**.
6. **Detune rendered** (A4, two saws):

   | Osc 2 | Readout | Heard (slowest beat, envelope depth) |
   |---|---|---|
   | 0 oct, +10 ¢ | 2.55 Hz beats | 2.55 Hz at 440 Hz (99 %) ✓ |
   | +1 oct, +10 ¢ | 5.10 Hz beats | 5.10 Hz at 880 Hz (72 %) ✓ |
   | −1 oct, +10 ¢ | 1.27 Hz beats | **2.55 Hz** at 440 Hz (65 %); nothing beats at 1.27 Hz |
   | +7 st, 0 ¢ | 0.00 Hz beats | **1.49 Hz** at 1320 Hz (80 %): the equal-tempered fifth's 3rd and 2nd Harmonics |

7. **Phone, 375 px, WebKit**: the knobs show no value until touched. Then the name's place shows the Geek figure alone: Resonance "Q 2.10", Key Track "2.16 kHz". The three Scope corners show the same line three times down the page ("2.27 ms · 440 Hz at A4"), even over a silent Amp Scope.

## Every item the layer adds

| Item | Where now | Right? | Verdict | Why |
|---|---|---|---|---|
| Resonance as Q (Q 1.32, Q 3.98 ×2) | knob | yes, except near 20 kHz | **keep**, add its law to the tip | The one readout a filter person reads first. But it shows Q 15.8 at a 20 kHz Cutoff, where the engine fades the Q to flat (issue 195). And no tip says how Resonance becomes Q (Q_dB = −3.01 + 27 r for low- and high-pass, Q = 0.5 · 40^r for band-pass and notch) |
| Mixer levels in dB | faders | yes | **keep**; give Ring dB too | Ring alone stays at 0 % among four dB faders |
| Amp Sustain, Volume in dB | fader, knob | yes | **keep** | Short, right, and gain is what dB is for |
| Osc 2 Octave ×2, ×½ | knob | yes | **move to the tip** | "×1" next to "0 oct" teaches nothing that "+1 oct" doesn't; the tip already has f₂ = f × 2^o |
| Osc 2 Semitone ×1.498 | knob | yes | **keep** | It is the ratio the ear hears. Better: add the cents from just (+7 is −2.0 ¢ off 3/2) to the tip |
| Detune's beats (2.55 Hz beats) | knob | **only at unison or up** | **keep, fix** | It is computed against "a tone at Osc 2's pitch". What is heard is the slowest beat between coinciding partials of Osc 1 and Osc 2: twice the readout an octave down, and nonzero at +7 with Detune at 0 (rendered above) |
| LFO Depth as swing (±0.50 oct, ±0.25 st, dB for Volume) | knob | yes | **keep** | The most useful readout: Depth in the Destination's unit |
| Key Track as the Cutoff at the Note | knob | yes | **move to the tip** | It hides the knob's own amount. At C4, 0 % and 100 % both read 2.00 kHz, the Cutoff's own figure. On a phone it is the only value shown while turning. The tip's formula can carry the live figure, as the Envelope stages' tips do |
| Scope corner: period · frequency | 3 Viewers | yes | **keep on the Oscillator Scope, drop on the other two** | The same line three times, even on a silent Amp Scope; on a phone it is three rows of the same noise |
| Spectrum hover: n = 2 | hover readout | yes | **keep** | Exactly what a geek wants, and it costs no room |
| Noise slope "pink: −3 dB/oct" | Oscillator Spectrum corner | yes | **keep** | Small, true, and points at what to look for |
| Waveform's series bₙ | tip | yes (Saw, Square, Triangle, Pulse) | **keep**; trim the Pulse's | The Pulse's letters run to about 70 words; one sentence would do |
| FM's sidebands n f₁ + k f₂, Jₖ(nβ), live β and J₀–J₃ | Pitch heading's tip | yes (the index is β whatever Osc 1's Octave) | **keep, and put it on FM's own tip** | Hovering FM, the knob a geek turns, gives no Under the hood at all |
| Ring's n f₁ ± m f₂, ½ bₙcₘ | Ring fader's tip | yes | **keep** | Right and short |
| Response \|H\| per Mode and Slope, with the digital vs analogue note | Mode's and Slope's tips | yes (checked at 48 kHz) | **keep** | The best paragraph in the layer: it admits the bilinear warp with figures |
| Key Track's fc = Cutoff × 2^(k(n−60)/12) | tip | yes | **keep** | Right, and the place the live figure belongs |
| Envelope stages' curves, τ = stage ÷ 3, 4, 6 with τ live | tips | yes | **keep**; say the Attack ends at 95 % | "95 % by the Attack time" is said, but not that the Decay therefore starts from 0.95, never the peak |
| Glide's f = f₂ + (f₁ − f₂)e^(−t/τ) | tip | yes (it slides in Hz) | **keep**; add one clause | In Hz, after one τ an octave up has gone 71 % of the way in pitch, an octave down only 55 %: an analogue portamento lags the pitch, not the Hz |
| LFO free Rate's T = 1/f | tip | yes | **drop** the formula, keep the live period | A reciprocal is not maths a geek needs written |
| LFO synced Rate's conversion (BPM ÷ 60 × 2 = 4 Hz) | tip | yes | **keep** | Useful at the tempo |
| LFO Depth's reaches (Pitch ±1 st, Cutoff ±2 oct…) | tip | yes | **keep** | The only place the laws are written down |
| Osc 2 Octave, Semitone, Detune formulas | tips | yes; Detune's "beats" as above | **keep**; fix Detune's definition | |
| Noise P(f) ∝ 1/f, Kellet's filter, as loud overall | 2 tips | yes (white's RMS) | **keep** | |
| Scope T = 1 / f₀ | 3 tips | yes | **keep, shorter** | |
| Spectrum fₙ = n × f₀ | 3 tips | yes | **replace** | Trivial; the FFT's facts are what is missing (see findings) |
| History lines | every tip | not checked (out of my scope) | **keep as they are** | They sit well last, in a quieter style; they never crowd the formula |

## What worked

The tips' maths is right where I checked it, and it is the engine's own: τ, Q in dB per stage, β with Osc 1's Octave divided out, Kellet at white's RMS. The layer states what it simplifies (the analogue |H| against the digital, "these figures hold for a Sine"). Live figures inside formulas (τ = … now, β = … now, J₀…J₃ now) are what makes it more than a textbook.

## Where I got stuck

- Detune's beats disagreed with my ear's arithmetic as soon as Osc 2 left unison or the octave up.
- Hovering FM gave no formula; I found it on the Pitch heading by accident.
- Key Track's readout made the knob unreadable as an amount.
- No tip has the Cutoff's own sum, the central equation of a subtractive voice.
- The Spectrums have no FFT facts.

## Would they

- **Like:** yes. The tips' maths is the real thing, sourced from the engine.
- **Share:** yes, to other DSP people, for the response-curve and FM paragraphs.
- **Come back:** yes, if Detune and Key Track are fixed. Those are the two numbers I'd use while playing.
- **Recommend:** yes, with "hover, don't read the knobs".

## Findings, ranked

1. Detune's "beats" readout is wrong unless Osc 2 is in unison or above: rendered at A4, Osc 2 −1 oct +10 ¢ reads 1.27 Hz but beats at 2.55 Hz, and Semitone +7 with Detune 0 reads 0.00 Hz while the tempered fifth beats 1.49 Hz (80 % deep); compute the slowest beat between coinciding partials of Osc 1 and Osc 2.
2. Key Track's Geek readout hides the knob's own amount (at C4, 0 % and 100 % both read 2.00 kHz; on a phone it is the only value shown while turning): give the knob back its %, and put the Cutoff at the Note in its tip's formula as a live figure.
3. FM's Bessel formula sits on the Pitch heading's tip, and the FM knob's tip has no Under the hood: put it on FM's tip.
4. The Cutoff's tip has no formula: the Effective Cutoff's sum in octaves (Envelope Amount × level, Velocity up to 2 oct, Key Track, the LFOs' ±2 oct, clamped 20 Hz to 20 kHz) is the maths a geek looks for first.
5. Ring's Mixer fader still reads 0 % in the layer, beside four faders in dB.
6. The Spectrums' tip formula fₙ = n × f₀ teaches nothing: say the FFT instead (8192 points, bin width fs / N, about 5.9 Hz at 48 kHz, a Blackman window, about 170 ms, and what the hover's dB is relative to).
7. Resonance's Q readout ignores the fade at the top: Q 15.8 at a 20 kHz Cutoff, where the engine plays a flat 0.71; and no tip gives Resonance's law (Q_dB = −3.01 + 27 r; Q = 0.5 · 40^r for band-pass and notch).
8. The Scope corner's line is repeated on all three Scopes, even on a silent Amp Scope (three identical rows on a phone): keep it on the Oscillator Scope alone.
9. Osc 2's Octave readout (×1, ×2, ×½) adds nothing to "0 oct": move it to the tip; and give Semitone's tip the cents from just (+7 is −2.0 ¢ off 3/2).
10. Glide's tip should say the slide is exponential in Hz: after one τ an octave up has covered 71 % of the pitch and an octave down 55 %, unlike an analogue portamento's lag in pitch.
11. The Attack's tip should say the Attack ends at 95 % of the peak, so the Decay never starts from the peak itself.
12. The free LFO Rate's T = 1 / f is too trivial for a formula: keep the live period, drop the equation.
13. The Pulse Waveform's Under the hood runs to about 70 words of letters: cut it to one sentence.
14. With the layer on, the knobs' aria-valuetext keeps the everyday units (Resonance "20 %", not Q 1.32): a screen-reader geek gets none of the readouts.
