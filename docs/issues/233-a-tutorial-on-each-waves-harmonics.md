# 233: A Tutorial on each wave's Harmonics

**What to build:** The owner's idea (inbox, 2026-11-05), for the next few days' polish of the UI, the performance and the learning: "make sure to cover during at least one of the tutorials the fact that waves present different and characteristic harmonic profiles." Today the Tutorials say it in passing: Bass and Wobble turn a saw into a square ("a square keeps only every other Harmonic"), Pluck shows a Pulse's missing lines, Acid's Filter takes Harmonics away. No Tutorial puts the waves side by side, and none plays the sine or the triangle. The Presets already say each wave's profile in a line (Pure Sine, Soft Triangle, Thin Pulse). Polish for v1 ([131](./131-v1.md)), at the owner's word that the next days go to the learning.

**Blocked by:** none

**Status:** done (2026-11-05). Built (2026-11-05) on day/2026-11-05, merged into main, released in 1.25.0; accepted by the owner: "OK with the rest of the tickets reviewed", with Claude's calls in it.

## What each wave shows

What the Oscillator Spectrum draws and the ear hears, the Filter open:

| Wave | Its Harmonics | Heard as |
| --- | --- | --- |
| Sine | the first alone | pure, a flute or a whistle |
| Triangle | odd ones only, falling fast (1/n²) | soft, a recorder |
| Square | odd ones only, falling slower (1/n) | hollow, a clarinet |
| Saw | every one, falling as 1/n | bright, buzzy, brass and strings |
| Pulse | every one but each (1/width)th, missing | nasal, thinner as it narrows |

## Decisions

Decided by the owner, 2026-11-05, Claude's recommendations accepted ("233 and 234 recommendations are okay."):

1. **A Tutorial of its own, short** (five or six Steps, one wave each, the Filter open and Ideal's marks on), since the idea is the comparison and a Step in Bass would hide it among the bass's other moves.
2. **First after the Tour**, before Bass: every later Tutorial leans on "a Note is a stack of Harmonics", and this one teaches it with nothing else moving. Bass's and Wobble's square Steps then recall it in a few words.
3. **It ends on a saw and a square together, an octave apart** (Bass's start), so its last Step hears the two profiles add up, and the next Tutorial begins where it ends.

## Agent Brief

**Category:** enhancement
**Summary:** A short new Tutorial, the first after the Tour, that plays each Waveform in turn and shows its own Harmonics on the Oscillator Spectrum.

**Current behavior:** The Tutorials mention Harmonics in passing (a square keeps every other one, a Pulse leaves gaps), and none plays a sine or a triangle. The Tour's last card opens Bass, the first Tutorial.

**Desired behavior:**
- A new Tutorial, five or six Steps, one Waveform each: sine, triangle, square, saw, pulse, the Filter open so every Harmonic shows, Ideal's marks on (a Step turns them on, as Bass does).
- Each Step's note says what the Spectrum shows and what the ear hears, in the table's terms above: which Harmonics, how fast they fall, what it sounds like.
- Its last Step sounds a saw and a square an octave apart, so the two profiles are heard adding up.
- It comes first in the Tutorials' order, right after the Tour; the Tour's last card opens it, and its end leads to Bass.
- Bass's and Wobble's square Steps may recall it in a few words; every word is still said plainly the first time a Tutorial uses it, since people take them in any order.
- The words follow the Tutorials' word rules and their tests, and the Tutorial plays on a phone as the others do.

**Out of scope:** new Waveforms, a change to the Oscillator Spectrum, other Tutorials' Steps beyond a few words recalling this one.

## How it was built

Built on 2026-11-05, test-first. A new Tutorial, first in the order, rebuilds the **Sub Ladder** Preset from Init in ten Steps: the Filter opened (Cutoff to 20 kHz, Resonance down), the Amp's Sustain all the way up so the lines hold still, Ideal turned on, then Osc 1 as a sine, a triangle, a square, a pulse and a saw again, each Step's note saying which Harmonics the Oscillator Spectrum shows, how fast they fall and what it sounds like (the table above). The last Step raises the Sub, a square an octave below the saw: the two profiles heard adding up, the Sub's triangles on the odd lines, the saw's circles on the even ones. Its end card leads to Bass; the Tour's last card now says Sub Ladder and its button reads "Build a Sub Ladder". Bass's and Wobble's square Steps add "as in Sub Ladder".

Claude's calls, open to the owner:

1. **It rebuilds Sub Ladder, an existing Preset of the Shapes group**, rather than a new Preset: its sound is exactly the decision's end, a saw and a square an octave apart, the Filter open, and its description already says the Sub fills the odd Harmonics, Osc 1 the even ones. The square comes from the Sub rather than from Osc 2 as in Bass; the sound and the picture are the same. So the Tutorial is called Sub Ladder in the menu, with "each wave's own Harmonics, side by side" under it.
2. **Ten Steps, not five or six:** six are the waves (five on Osc 1, then the Sub), and four set the stage, since Sub Ladder's Preset has the Filter open, no Resonance and full Sustain, and Ideal is turned on as in Bass.
3. **The order is sine, triangle, square, pulse, saw**, the saw last rather than the pulse, so the saw is still sounding when the Sub comes in; the pulse, between the square and the saw, shows the even Harmonics coming back, every fourth one missing at the Pulse's starting width (25 %).
4. **A Step may now come back to a control with a new target** (Osc 1's Waveform five times): the test that each Step asks for something new now checks a control and its target together, never the same pair twice.
5. The Tour's button is named after the first Tutorial ("Build a Sub Ladder"), as it was after Bass.

**To try in the app:** take the Tour to its last card and press Build a Sub Ladder (or pick Sub Ladder in the Tutorial menu); play a held Note at each wave Step and watch the Oscillator Spectrum and Ideal's circles; at the last Step, hear the saw and the square as one Note; the end card should offer Bass next. On a phone, check each note reads whole.
