# 194: Words that lag the code

**What to build:** The word checks' and ripple hunts' findings of 1.20.0 and 1.21.0 not yet fixed (inbox, 2026-11-01 and 2026-11-02): tips, Preset descriptions, the README and issue texts that say what is no longer true, or more than the sound does. Polish of v1's words ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-02) on night/2026-11-02, for the owner to try

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

1. **Each claim rendered or checked** as the fact-checker does, and a test where one holds the words.

## Agent Brief

**Category:** enhancement
**Summary:** Fix the words that the last two releases' checks found untrue or out of date.

**Current behavior and desired behavior, item by item:**
- **"rung, spike, bar"** (CONTEXT lists them under Avoid since 129): 8 tips, 11 Preset descriptions and two Demo captions still use them → the glossary's words.
- **The Guides' tip** says a trace beyond them "has been boosted by Resonance"; a chord passes them with none (an A major triad from A3 peaks at 1.28 against 0.50 on the Amp Scope), the Filter Tap by about 5 % with Resonance 0, Pink Noise on the Oscillator Tap → say what passes them (several Notes, a full mix), held by issue 159's test.
- **The Tempo tip** ("Drag it or use the arrows; double-click to type it") sits on the narrow layout's BPM button, which only opens the panel, while the panel's dial has no tip → each its own tip.
- **Wobble's "so it lands on the beat", Stutter's "on the beat", and Key Sync** describe Retrigger, while Sync is now what puts a cycle on the beat (and Stutter's 8 Hz is 1/16 at 120) → words that tell Retrigger from Sync.
- **The MIDI panel's Bluetooth line** names "Audio MIDI Setup on a Mac" only → say how on Windows (and that Linux is untried), or that the system's MIDI settings pair it.
- **The LFO Rate's History line** ties ARP's "smoother vibrato" to the .03 Hz floor; the manual credits the low-frequency sine → reword from the manual.
- **FM's History line and the DX7:** find the primary source (issue 191, question 6).
- **The README:** "What you can do" says nothing of the tempo, LFO Sync, Legato or aftertouch; its screenshot (2026-10-31) shows the header before 112 → add them; retake the screenshot.
- **Issue texts:** 112's body still shows "1/8 · 4 Hz" and decision 11's "buttons 8 and 9", and 157's padding of Freeze and Snapshot has no "Since then" there; 131 still ticks "146: a tip link (Buy Me a Coffee)" (172 dropped it); 136's ticked "a synced free LFO starts its cycle on" a Start and 169's "±dB" box await questions 3 and 5 of [191](./191-the-owners-calls-after-1-21.md) → "Since then" lines.

**Key interfaces:**
- The tips, the Presets' descriptions, the Demo's captions
- The README and its screenshot
- The issue files' "Since then" lines

**Acceptance criteria:**
- [ ] Each item fixed, rendered where it is about sound, with the fact-checker's method
- [ ] The tips', Presets' and word tests pass; every test passes in Linux's fonts too

**Out of scope:**
- New words beyond what the items need

## How it was built

- **Rung, spike, bar:** nine tips, eleven Preset descriptions and the two Demo captions now say Harmonic, or line (the glossary's picture of a Harmonic on a Spectrum); Pluck Shape's Timeline "spike" is a sharp peak, Thin Pulse's Scope one a narrow blip. A new word test reads every tip, Preset description and Demo caption for rungs, spikes and Harmonic bars. Partials stay where they are not Harmonics (FM's, Ring's), and a bar where it is the music's.
- **The Guides' tip** (and CONTEXT.md's Guides): where one Note peaks; Resonance takes a trace beyond them, and so do several Notes at once and the Noise, and the Filter alone a little. Issue 159's tip test now holds that, and no longer "boosted by Resonance". The figures are the check's (a triad at 1.28 against 0.50, the Filter Tap about 5 % over at Resonance 0); not rendered again tonight.
- **The Tempo:** the narrow layout's BPM button has a tip of its own ("Press it to set it: the BPM and Tap open below it"); the BPM in the field it opens has the drag-and-arrows tip, which it lacked. An e2e test hovers both.
- **Retrigger and Sync:** Wobble's says Sync keeps the speed to the beat and Retrigger starts it at the Cutoff on every Note; Stutter's is "Sync, so at any tempo", its stutter starting open "wherever it falls"; Key Sync's names it key sync, not the LFO's Sync, its Rate in Hz.
- **Bluetooth:** "once the system pairs it as a MIDI device (on a Mac, in Audio MIDI Setup; on Windows and Linux, untried)". Claude's call, open to the owner: no Windows steps, since none was tried here.
- **The LFO Rate's History:** the manual's credit goes to the slow sine: "its manual makes a smoother vibrato with a slow sine".
- **FM and the DX7:** Yamaha's own Hub article (*Discovering Digital FM: John Chowning Remembers*) gives the DX7's 1983 and Chowning's "The DX7 used my underlying principles and research": recorded in the research as S33, graded B (the maker's own page), and added to FM's sources; the line is unchanged. Yamaha's corporate history pages refused the fetch. Claude's call, open to the owner: B rather than A, as a maker's page.
- **The README:** a "Play in time" line (the tempo, Tap, a MIDI clock, LFO Sync, Legato, aftertouch), and the screenshot retaken as issue 111 took it (the Demo on Acid, 1920 × 1080, Dark, its card closed), today's header with the BPM and Tap.
- **Issue texts:** "Since then" lines in 112 (the readout and decision 11), 157 (the phone rule's padding), 136 and 169 (each waiting on 191's questions 3 and 5), and 131's 146 line marked dropped by 172.
- **Tests:** tsc, the lint, the word, tips, History, Presets and Demo unit tests; tooltips, piano, header and keyboard-access specs in Chromium. Linux's fonts not tried here (nothing measures a width).

**To try:** at under 861 px, hover the BPM button, then open it and hover the BPM; hover the Guides' switch in Display; read Wobble's, Stutter's and Key Sync's descriptions; the MIDI panel with nothing plugged in; the README's new screenshot.
