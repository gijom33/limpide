# Persona review 7: the recruiter, or the hiring manager

Ran on version 1.26.1 (build 38df0ad) on 2026-11-07: the live site and the public GitHub pages, fresh browser contexts. Chromium at 1440 × 900 for the hiring manager on a laptop, iPhone-sized WebKit (390 × 844, then 393 × 700) for the recruiter on a phone; about two minutes each.

Screenshots: `/private/tmp/rev7-1107/`.

## First impression

**Hiring manager (laptop):** "A dark, polished app that looks like a commercial plugin, with a card in the middle: a synthesizer you can see through, version 1.26.1 dated today, and *Designed and directed by Guillaume Boillet; code written with Claude Code, Anthropic's AI coding agent, following Matt Pocock's AI Hero methodology.* I know what it is, who made it and how, before I've touched anything." (d-first.png)

**Recruiter (phone):** "Same card, big type. Logo, one sentence, 'Touch and hold any control to see what it does', and the Made by line with his name as a link, all on the first screen, with two buttons at the bottom." (m-first.png)

## What they tried

1. **Hiring manager, Play the Demo.** The page switched to the Acid Preset and every panel came alive: the Filter's knobs turning, Scope and Spectrum moving, the Envelope Timeline pulsing, a card at the bottom naming the part with Stop and a progress bar. But a large "Demo" tip, fourteen lines of text, stayed open over the Amp panel for the whole Demo; moving the mouse elsewhere opened a second tip and left the first one there (still open after 20 seconds). It is the Demo button's focus tip: the About card hands focus to the Demo button, and Chromium shows the focus ring and tip although the click came from a mouse. WebKit does not show it. (d-demo12s.png, d-demo-after-move.png)
2. **Hiring manager, Take the Tour** (fresh context). A card "Oscillators and Mixer, 1 of 6" explains in plain words what an Oscillator is while the synth switches the waveform itself. Clear, but long to read for someone with two minutes. (d-tour1.png)
3. **Recruiter, Play the Demo on the phone.** The page scrolled to the Amp tab, the Kick part played, and the bottom card said in plain words "A kick drum, made by the synth". Nothing covered the panels. (m-demo.png)
4. **Recruiter, the short phone.** At 393 × 700 "Play the Demo" sits at y = 631 to 667, fully on the first screen. (m-700.png)
5. **Hiring manager, the repository's front page.** 1,481 commits, 40 tags, the 1.26.1 release four minutes old, CI green, MIT, code of conduct, contributing, security policy, topic tags; the latest commit by "gijom33 and claude". The first row of the file list is `.claude`, last touched by "No issue: the outreach drafts tag the site's link with a campaign", which reads oddly as the first thing on the page. (g-top.png)
6. **Hiring manager, the README.** The tagline, then "Designed and directed by Guillaume Boillet (linked to LinkedIn); code written with Claude Code", then "Play it in your browser" and a screenshot of the Demo. "How this was built" lists the PRD, issues, ADRs, glossary, tests first, inbox, reviews and CLAUDE.md, and says who decides what. Its last paragraph gives the numbers: 26,393 lines, 3,593 tests, 73.6 % coverage, "the Demo at 56 frames a second for 112.3% of a processor core". (g-readme.png)
7. **Hiring manager, the owner's profile.** "gijom33", a circuit-board avatar, a bicycle emoji status, San Francisco Bay Area, one pinned repo, 1,482 contributions in the last year, all of them since October. Still no name, bio or link. (g-profile.png)
8. **Recruiter, GitHub on the phone.** Description, site link, tags, MIT, 1 star; readable. (g-phone.png)

## What worked

- **The question "who built this, and how" is answered on the first screen, in the same honest sentence on the site and in the README.** Both now link the name to LinkedIn.
- **It looks finished and current:** version and today's date on the first card, 40 releases, CI green, privacy and licence stated plainly. No console errors.
- **Clear without music knowledge.** The Demo card names what you hear in everyday words; the phone reflow has no broken layout.
- **For the hiring manager the README's method section is the conversation starter:** a real product process, every artefact linked, the split between owner and agent stated.

## Where they got stuck

- **The Demo's own tip covers the Amp panel for the whole Demo in Chromium** (Chrome and Edge, which the README recommends). A laptop visitor's first look at the product in motion has a block of text over a third of it, and it does not go away when the mouse moves. (d-demo12s.png, d-demo-after-move.png)
- **The GitHub profile still undersells the author.** No name, bio or link; a hiring manager arriving from the repo cannot get to the person from there.
- **"112.3% of a processor core"** in the README's stats reads to a skimming manager like a warning (more than a whole core for a web page?), with no word saying whether that is good, expected or a known cost.
- Minor: the README's stats line says "At 1.26.0" while the site says 1.26.1; the `.claude` row's commit subject on the front page is cryptic to an outsider.

## Would they

| | Recruiter | Hiring manager |
|---|---|---|
| **Like** | Yes: polished, moving, and clear about who made it. | Yes: polish plus a visible process. |
| **Share** | Yes: they can say in one line what it is and who made it. | Yes, to a team, as an example of directing an AI agent with discipline. |
| **Come back** | No: nothing to come back for as a non-musician. | To the repo, if evaluating him. |
| **Recommend** | Would mention the author to a colleague. | Yes, as a portfolio piece. |

One sentence each:

- **Recruiter:** "Guillaume Boillet designed and directed a polished, free music-learning web app, with the code written by Claude Code, and he says so up front."
- **Hiring manager:** "He ran a real product process (PRD, issues, ADRs, tests, CI, 40 releases) with an AI coding agent and shipped a finished TypeScript and Web Audio app; that is the skill on show, and he is honest about it."

## Since the last run (2026-10-30, 1.16.0)

- **README credits the author only at the bottom, unlinked:** fixed. The credit line sits under the tagline and links the name to LinkedIn.
- **Welcome card's buttons below the fold on a shorter phone:** fixed. At 393 × 700 "Play the Demo" is fully on the first screen (it ended at 717 before).
- **GitHub profile bare:** unchanged (the owner's own settings, not the repository).
- New since then: About names the AI Hero methodology; the README carries per-release numbers and a statistics page; 40 releases instead of 27. New problem: the Demo's focus tip in Chromium (not seen on 1.16.0's run).

## Three findings, ranked

1. **The Demo button's tip covers the Amp panel through the whole Demo in Chromium:** after a mouse click on About's "Play the Demo", focus moves to the Demo button with a focus ring, its fourteen-line tip opens and stays even when the mouse moves elsewhere (WebKit unaffected); show no tip for focus handed over by the page after a mouse or touch start. Screenshot: /private/tmp/rev7-1107/d-demo-after-move.png
2. **GitHub profile still bare:** a hiring manager clicking "gijom33" from the repo finds no name, bio or link; fill in the profile's name, bio and website (the owner's own settings). Screenshot: /private/tmp/rev7-1107/g-profile.png
3. **README's "112.3% of a processor core" reads as a warning to a skimming manager:** say it plainly (for example, what it means on the slowest machine Limpide supports) or leave the CPU figure to the statistics page. Screenshot: /private/tmp/rev7-1107/g-readme.png
