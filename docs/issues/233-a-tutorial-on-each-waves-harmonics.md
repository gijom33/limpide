# 233: A Tutorial on each wave's Harmonics

**What to build:** The owner's idea (inbox, 2026-11-05), for the next few days' polish of the UI, the performance and the learning: "make sure to cover during at least one of the tutorials the fact that waves present different and characteristic harmonic profiles." Today the Tutorials say it in passing: Bass and Wobble turn a saw into a square ("a square keeps only every other Harmonic"), Pluck shows a Pulse's missing lines, Acid's Filter takes Harmonics away. No Tutorial puts the waves side by side, and none plays the sine or the triangle. The Presets already say each wave's profile in a line (Pure Sine, Soft Triangle, Thin Pulse). Polish for v1 ([131](./131-v1.md)), at the owner's word that the next days go to the learning.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The three questions answered by the owner, 2026-11-05, as recommended: "233 and 234 recommendations are okay."

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
