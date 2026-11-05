# 236: Limpide presented by what it shows

**What to build:** The owner's idea (inbox, 2026-11-05): "let's focus on the educational aspects on how we present Limpide. Lets be honest there is nothing novel in the sounds created by the synth. It's unique in the way it shows the intermediate and final temporal and spectral information." Today's one line, the same in the README, About and the repository's description: "A subtractive synthesizer that shows you what each stage does to the sound." It opens on the synthesizer, which is not new, and leaves the Viewers (a Scope and a Spectrum after the Oscillators, the Filter and the Amp, in time and in frequency) to the second half. The page itself has no description for a link's preview. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The line picked by the owner, 2026-11-05: (a).

## Where Limpide says what it is

- the README's tagline and its first paragraphs, and what it claims for the sounds and Presets;
- About's tagline;
- the repository's description on GitHub;
- the page's `<title>`, and a description for a shared link's preview (none today);
- the welcome card and the Tour's first card, where they say what Limpide is for.

## Decisions

Decided by the owner, 2026-11-05: "Line a for Limpide's description works better."

1. **The line:** "A synthesizer you can see through: the wave and its Harmonics after every stage, as you play." (*Limpide* is French for clear, see-through.)

Claude's calls, open to the owner:

2. **The sounds said plainly:** the README's paragraph on the Presets says they are the classic subtractive sounds, chosen to teach, each pointing at what to watch.
3. **The screenshot kept:** the Demo playing with every Viewer drawn already says it.
4. **The repository's description on GitHub** takes the line too; it is changed by hand with the release that ships the rest, as it shows to visitors at once.

## Agent Brief

**Category:** enhancement
**Summary:** Limpide says what it is by what it shows: the owner's line, wherever the page and the README say what Limpide is.

**Current behavior:** The README, About and the repository's description say "A subtractive synthesizer that shows you what each stage does to the sound." The page's title is "Limpide" with no description for a shared link's preview.

**Desired behavior:**
- The README's tagline and About's tagline read: "A synthesizer you can see through: the wave and its Harmonics after every stage, as you play."
- The page carries the line as its description (and as a shared link's preview text), its title unchanged.
- The README's first paragraphs lead with what the Viewers show (a Scope and a Spectrum after the Oscillators, the Filter and the Amp, in time and in frequency); its words on the Presets say they are the classic subtractive sounds, chosen to teach.
- The welcome card and the Tour's first card, where they say what Limpide is for, agree with the line, in the Tutorials' plain words.
- Tests that read the old tagline read the new one.

**Out of scope:** the screenshot, the Presets themselves, the repository's description (changed by hand at the release).
