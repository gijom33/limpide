# 236: Limpide presented by what it shows

**What to build:** The owner's idea (inbox, 2026-11-05): "let's focus on the educational aspects on how we present Limpide. Lets be honest there is nothing novel in the sounds created by the synth. It's unique in the way it shows the intermediate and final temporal and spectral information." Today's one line, the same in the README, About and the repository's description: "A subtractive synthesizer that shows you what each stage does to the sound." It opens on the synthesizer, which is not new, and leaves the Viewers (a Scope and a Spectrum after the Oscillators, the Filter and the Amp, in time and in frequency) to the second half. The page itself has no description for a link's preview. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-05) on night/2026-11-05, for the owner to try

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

## How it was built

The owner's line, "A synthesizer you can see through: the wave and its Harmonics after every stage, as you play.", is now the README's tagline and About's, and so the welcome card's, which is About's at a first visit. The page's title stays "Limpide"; the page now has a description with the line, and a shared link's preview carries the same line under the title "Limpide" (Open Graph). The README's first paragraphs lead with what the Viewers show: *limpide* is French for clear, then a Scope and a Spectrum under the Oscillators, the Filter and the Amp, the wave in time and its Harmonics in frequency, live. Next, the sounds said plainly: a classic subtractive synth, laid out as its own signal-flow diagram. The Presets line says they are the classic subtractive sounds, chosen to teach, each saying what to watch. The repository's description on GitHub is untouched, as the brief says: it is changed by hand at the release.

Claude's calls, open to the owner:

1. **The welcome's own sentences and the Tour's first card are unchanged.** Neither says what Limpide is for: the welcome says what to do ("Hear what it can do, or start playing…"), and the Tour's first card starts with the Oscillators. The welcome card shows the new line above them. The first card's last paragraph already says what its two pictures show, so it agrees with the line.
2. **The preview text has no image.** The screenshot is kept and stays out of scope, so a shared link shows the title and the line only. An `og:image` with the screenshot could follow.
3. **The README's second paragraph says the sounds are not new** ("The sounds themselves are not new: Limpide is a classic subtractive synth…"), in the owner's spirit, before the signal-flow paragraph it already had.

**To try:** open the page in a private window: the welcome card shows the new line under the name. Open About from the logo. Read the README's top on the branch. After the release, paste the site's link into a chat app to see the preview's line. Then change the repository's description on GitHub by hand, as decision 4 says.
