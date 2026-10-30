# Persona review 7: the recruiter, or the hiring manager

iPhone-sized WebKit (393 × 852) for the recruiter, then Chromium at 1440 × 900 for the hiring manager; about two minutes each; 2026-10-30; version 1.16.0 (build 328a370), the live site and the public GitHub pages, fresh browser contexts.

Screenshots: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-7/`.

## First impression

**Recruiter (phone):** "A dark, polished music app. The card says it's a synthesizer that shows what each stage does to the sound, and right under the version and today's date: *Designed and directed by Guillaume Boillet; code written with Claude Code, Anthropic's AI coding agent.* That's my answer: his product, an AI wrote the code, and he says so. His name is a link." (r01-first.png)

**Hiring manager (laptop):** "Looks like a commercial plugin. On GitHub: 478 commits, 27 tags with a 1.16.0 release, CI green, TypeScript, an e2e folder, ADRs, a code of conduct and a contributing guide. This is a maintained project, not a weekend demo." (m01-first.png, m02-github.png)

## What they tried

1. **Recruiter, the welcome card.** Read the "Made by" line. Tapped the name: it opens the owner's LinkedIn profile. The card also links "AI Hero", the source and the third-party notices. (r01-first.png)
2. **Recruiter, Play the Demo.** The patch changed to Acid, the Filter's knobs, Scope and Spectrum moved, and a card at the bottom said in plain words what was happening: "a squelchy, talking bass line", with Stop and a progress bar. No music knowledge needed to follow it. (r02-demo.png, r02b-demo-later.png)
3. **Recruiter, GitHub on the phone.** The repo page shows the description, the site link, topic tags, MIT, 1 star, and "gijom33 and claude" on the latest commit. The README opens with the tagline, "Play it in your browser", and a screenshot of the app; the first paragraph is readable. Scrolled through "What you can do" and stopped at "Run it locally". (r04-github.png, r06-readme-top.png)
4. **Hiring manager, the repository's front page.** Read the sidebar (description, link, MIT, releases), skimmed the file list, then jumped to the README's "How this was built": designed and directed by Guillaume Boillet, code by Claude Code, Co-Authored-By on every commit, the AI Hero method, with links to the PRD, issues, ADRs, tests and CLAUDE.md. (m02-github.png, m03-github-full.png)
5. **Hiring manager, the owner's profile.** Clicked "gijom33": a handle, a circuit-board avatar, "San Francisco Bay Area", one pinned repo, and a contribution graph empty until October. No name, no bio, no link. (m04-profile.png)

## What worked

- **The AI credit is now stated in words, in both places.** The About card and the README say the same honest sentence: the owner designed and directed, Claude Code wrote the code. The recruiter's "did he write this or did Claude?" is answered before it is asked.
- **The author is one tap away.** "Guillaume Boillet" in About links to LinkedIn.
- **The README sells on a phone.** A screenshot under the tagline, a one-tap "Play it in your browser", and a first paragraph in plain words.
- **The Demo explains itself.** Its card describes what you hear in everyday words, so a non-musician gets the point.
- **Signals of a finished, maintained product:** version and date on the first card, 27 tagged releases, CI green, privacy stated plainly.

## Where they got stuck

- **The GitHub profile still undersells the author.** The hiring manager clicking "gijom33" from the repo finds no name, no bio and no LinkedIn link, and a graph that is empty for eleven months. The route from the code to the person exists only through the site's About. (m04-profile.png)
- **The README credits the author only at the bottom.** "How this was built" sits after "Run it locally" (install commands), where a phone reader has stopped; the name there is plain text, not the LinkedIn link About has. (r06-readme-top.png)
- **The welcome card is long on a shorter phone.** The License and Privacy paragraphs sit above the buttons; at 393 × 700 (a phone with LinkedIn's in-app bars) "Play the Demo" starts at y = 681, half below the fold. A recruiter skimming the first screen may not see the button. (r08-card-700.png)

## Would they

| | Recruiter | Hiring manager |
|---|---|---|
| **Like** | Yes: it looks finished and the Demo moves. | Yes: polish plus visible process. |
| **Share** | Yes, the LinkedIn post: they can now say what it is and who made it. | Yes, to a team, as an example of directing an AI agent with discipline. |
| **Come back** | No, nothing to come back for as a non-musician. | To the repo, if evaluating him. |
| **Recommend** | Would mention the author to a colleague. | Yes, as a portfolio piece. |
| **Reach out** | **Yes.** The name links to LinkedIn, and the credit line gives an opening: "you directed an AI to build this, tell me how". | **Yes, probably.** The README's method section is the conversation starter. They would get there through the site, not through the GitHub profile. |

One sentence each:

- **Recruiter:** "Guillaume Boillet designed and directed a polished, free music-learning web app, with the code written by Claude Code, and says so plainly."
- **Hiring manager:** "He ran a real product process (PRD, issues, ADRs, tests, CI, 27 releases) with an AI coding agent and shipped a finished TypeScript and Web Audio app; that is the skill on show, and he is honest about it."

## Since 1.8.1

All three findings of 2026-10-26 were acted on, two in full:

- **No AI credit in words:** fixed. About and the README both carry "Designed and directed by Guillaume Boillet; code written with Claude Code", and the README adds a "How this was built" section.
- **No contact path:** half fixed. The name in About links to LinkedIn. The GitHub profile still has no name, bio or link, and the README's name is not linked.
- **README with no picture, opening in jargon:** fixed. A screenshot under the tagline, a "Play it in your browser" link, and a plain first paragraph.

Also new since then: the Demo's card with plain-words captions, and 27 tagged releases on GitHub.

## Three findings, ranked

1. **GitHub profile still bare:** a hiring manager clicking "gijom33" from the repo finds no name, bio or LinkedIn link; fill in the profile's name, bio and website (the owner's own settings, not the repo). Screenshot: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-7/m04-profile.png
2. **README credits the author only at the bottom, unlinked:** "How this was built" sits under "Run it locally", past where a phone reader stops; put one line under the tagline, e.g. "By Guillaume Boillet (LinkedIn), built with Claude Code: how", linking the name as About does. Screenshot: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-7/r06-readme-top.png
3. **Welcome card's buttons fall below the fold on a shorter phone:** at 393 × 700 (LinkedIn's in-app bars) "Play the Demo" starts at y = 681, under the License and Privacy paragraphs; keep the buttons on the first screen. Screenshot: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-7/r08-card-700.png
