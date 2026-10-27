# 42: Reviews: personas and code

**What to build:** Two looks at Limpide from the outside, each ending in lines for the inbox rather than changes. Personas: the synth judged by several kinds of visitor, each from their own point of view, on the published site. Code: the AI Hero code review (the `code-review` skill) of the whole codebase, against its documented standards and the PRD. From the inbox, 2026-10-25.

**Blocked by:** none (the Learner's second run waits for the tutorials, [40](./40-preset-tutorials.md))

**Status:** the ten persona reviews ran on 2026-10-26 (version 1.8.1); their findings are in the inbox. Still to do: the LinkedIn tap-through on a real phone, the Learner's second run, the code review

## Why these profiles

The owner will post Limpide on LinkedIn: the link is the site, [gijom33.github.io/limpide](https://gijom33.github.io/limpide/), and the post may link the repository too. So the personas are the people a LinkedIn post reaches, not only the PRD's learners. Most open the link on a phone, in LinkedIn's in-app browser (no MIDI, sound held back until the page is touched), with little patience: what the first ten seconds show matters. Four profiles are the owner's (1 to 4), three complete them (5 to 7), and the owner added three who judge the repository (8 to 10). Issue 42's first ideas went into them: the beginner into 1, the sound designer into 2, the teacher into 5, the screen reader into 6, the phone visitor into 1.

## How a review runs

One agent per profile, on the published site (and the repository where the profile says so), never on a local build. Each is given its profile, what that person does not know, a device and window size, a time budget and goals, and explores freely within them. Agents cannot open LinkedIn's in-app browser: the closest stand-in is Safari's engine (WebKit) at a phone's size, and the owner taps through the real post once on their own phone.

Each writes a short report:

- **First impression:** what they understood in the first ten seconds, in their own words
- **What they tried**, in order, and what happened
- **What worked**, and **where they got stuck or gave up**
- **Would they** like, share, come back, recommend (each yes or no, and why)
- **Three findings, ranked**, each one line for the inbox, with a screenshot where it is visual

The findings go to the inbox; nothing is changed during a review.

## The profiles

### 1. The curious contact (knows nothing about music)

A LinkedIn contact who taps the link out of curiosity or friendship. Has never touched a synth and doesn't know what a filter or an oscillator is.

- **Device:** phone (iPhone size, 393 × 852, WebKit), portrait. **Time:** 60 seconds, then a second look of 2 minutes if the first held them
- **Goals:** understand what this is; hear a sound; find something fun to do
- **Asks:** Is it obvious what to tap? Is there a "wow"? Does it explain itself without jargon? Would I like or share the post?
- **Success:** they heard sound, played the Demo or a key, and could say "it shows you what sound looks like"

### 2. The synth enthusiast

Has played hardware and software synths (a Minimoog, a Juno, Vital, Serum). Will compare Limpide with Ableton's *Learning Synths* and their own instruments.

- **Device:** laptop (1440 × 900, Chromium), a MIDI keyboard or controller. **Time:** 15 minutes
- **Goals:** play the Presets; make a sound of their own from Init; map a controller with MIDI Learn
- **Asks:** Does it sound good? Is the Filter musical at high Resonance (issue 41)? Are the Envelopes snappy, the Glide and LFOs useful? Are the Presets worth playing? What is missing that every synth has?
- **Success:** they made a sound they liked and would send the link to a synth friend

### 3. The UI maniac

A product designer who notices a 2 px misalignment. Judges the craft, not the synthesis.

- **Device:** every layout: phone (375 and 430), foldable (690 × 830), the in-between widths (601, 860, 861), laptop (1440 × 900), wide (1920 × 1080, 2560 × 1440); both themes. **Time:** 20 minutes
- **Goals:** go through every screen state (each tab, each panel, About, MIDI Learn) at every size
- **Asks:** Do spacing, alignment and type follow one system? Are states (hover, focus, pressed, disabled) consistent? Does anything jump, overlap, clip or scroll sideways? Does motion help or distract? Is the colour by stage consistent everywhere?
- **Success:** a ranked list of nitpicks, each with a screenshot and the width it happens at

### 4. The AI expert

Builds with AI agents or follows the field. Interested in how Limpide was made more than in the synth itself.

- **Device:** laptop. **Where:** the site, then the repository ([github.com/gijom33/limpide](https://github.com/gijom33/limpide)): README, `docs/` (PRD, issues, ADRs, inbox), the commit history, the tests. **Time:** 20 minutes
- **Goals:** understand the process (PRD, issues, ADRs, the AI Hero method) and judge the result
- **Asks:** Is the AI-assisted process visible and believable from the repository? Is the code what one would expect from it: structure, tests, consistency? Do the docs agree with the app? Would the LinkedIn post's claims hold up?
- **Success:** they could explain how it was built, and say whether they would work this way

### 5. The learner, or the teacher

Who the PRD is for: someone who wants to understand subtractive synthesis, or a teacher who would show it to a class.

- **Device:** laptop (1440 × 900), or a projector-sized window (1920 × 1080) for the teacher. **Time:** 30 minutes
- **Goals:** learn what each stage does; for the teacher, plan a 15-minute lesson with it
- **Asks:** Do the Viewers, the tooltips and the Maths Layer teach? Is the cause and effect visible (turn the Cutoff, see the Harmonics go)? Where does a newcomer get lost? Could a class follow it on a projector?
- **Success:** they could explain the signal chain afterwards
- **Runs twice:** now, and again once the tutorials are built (issue 40), to compare

### 6. Accessibility: keyboard only and screen reader

Someone who navigates without a mouse, and someone who uses VoiceOver or NVDA.

- **Device:** laptop, keyboard only; the accessibility tree as a screen reader reads it. **Time:** 15 minutes
- **Goals:** reach and change every control; play notes; load a Preset; open and close every panel
- **Asks:** Is the focus order the visual order (the header's one order, issue 44)? Is focus always visible? Does every control have a name, a role and a value read aloud? Are Viewers described, or at least named? Can a panel be closed with Escape?
- **Success:** a sound made and changed without the mouse

### 7. The recruiter, or the hiring manager

On LinkedIn many readers are really asking "what does this say about the author?". Skims, does not play much.

- **Device:** laptop or phone. **Where:** the site, About, the README, the repository's front page. **Time:** 2 minutes
- **Goals:** understand what was built, by whom, and how
- **Asks:** Is it impressive at a glance? Clear without music knowledge? Is the author's part (and the AI's) stated honestly? Does it look finished?
- **Success:** they can say in one sentence what the author built and what it shows about them

### 8. The open-source expert, sceptical of AI

Maintains open-source projects and distrusts AI-written code: looks for what would make the project hard to maintain or contribute to, and for the marks of unreviewed AI output.

- **Where:** the repository on GitHub and its files. **Time:** 30 minutes
- **Goals:** decide whether they would contribute, depend on it, or recommend it as an example of AI-assisted open source
- **Asks:** Licence, contribution guide, issue templates, code of conduct? Could a stranger build, test and change it? Is the code readable and maintainable by humans, or verbose and repetitive? Do the tests test something? Dependencies few and current? Is the AI's part disclosed? What would they say in a Hacker News comment?
- **Success:** a fair verdict, sceptical but backed by files and lines

### 9. The TypeScript, React and Web Audio expert

A senior front-end engineer who knows the stack Limpide is written in (TypeScript, React, Vite, the Web Audio API, Canvas).

- **Where:** the code (`src/`), its configuration and tests; the site for behaviour and performance. **Time:** 30 minutes
- **Goals:** judge the code as they would a colleague's pull request
- **Asks:** How strict are the types (any, casts, non-null assertions)? Are React effects and state idiomatic, and is keeping the engine and Viewers outside React (ADR-0002) done well? Is the Web Audio graph correct (scheduling, node lifecycle, leaks, clicks)? Is the render loop efficient? Bundle size, accessibility of the markup, error handling?
- **Success:** a review with specific file:line findings, the good with the bad

### 10. The software development methodology expert

Knows XP, Scrum and Kanban, Shape Up, DDD and TDD, and how teams use them. Judges the process, not the product.

- **Where:** `docs/` (PRD, issues, ADRs, inbox, the glossary), the commit history, the tests and CI. **Time:** 30 minutes
- **Goals:** say how the method used here (Matt Pocock's AI Hero: PRD, vertical-slice issues, ADRs, grilling, TDD, an inbox) compares with established ones, and whether it is practised as described
- **Asks:** Can a user story be traced to an issue, a commit and a test? Is TDD visible in the history (tests with or before the code)? Are issues vertical slices with a definition of done? Are ADRs real decisions with alternatives? Is release and versioning discipline sound? What would they teach from it, and what would they warn against?
- **Success:** a verdict on the method, with evidence from the repository

## Verdicts (2026-10-26, version 1.8.1)

Reviewed by agents in headless browsers: none could hear, so sound was judged from the Viewers and the audio graph.

1. **Curious contact:** would like the post, not share it: "a synth app with dancing lines". The Demo impresses but explains nothing on a phone, and tooltips never open on touch.
2. **Synth enthusiast:** would send it to a synth friend as "a visual synth for seeing what each stage does", not a performance instrument. The Filter rings without hiss (issue 41 holds); missing: pitch bend, the sustain pedal, Pads with one Voice.
3. **UI maniac:** would like and recommend, not share yet: the Release fader wraps alone at 1331–1434 px, inner margins differ on phones and at 861–960 px; 26 nitpicks in all, none of them sideways scroll or clipping.
4. **AI expert:** believes the "built with AI" claim from the commit trailers and the docs trail, but nothing a visitor reaches says it, and docs drift is what a sceptic would quote.
5. **Learner and teacher:** the learner could explain the signal chain afterwards; the teacher planned a lesson. The core controls and the Viewers have no tooltip, and there is no "start here".
6. **Accessibility:** a sound can be made and changed without the mouse. Space freezes instead of pressing buttons; focus is lost when panels close; the Viewers say nothing to a screen reader.
7. **Recruiter and hiring manager:** impressed, but no line says what the author did and what Claude did, and no link to reach the author.
8. **Open-source sceptic:** "went in expecting slop and came out mostly impressed": the tests catch real mutations in the logic, but `App.tsx` is the weak, untested glue, and nothing invites contributors.
9. **TypeScript, React and Web Audio expert:** strong, honest types (no `any`), no node leaks; two fixes before approving: the Timeline's cost per frame and the blank page without storage.
10. **Methodology expert:** a well-chosen solo method whose documents keep 206 commits coherent; it lacks a second pair of eyes (the code review never ran), frozen ADRs, and commit-to-issue traceability.

### 11. The open-source legal expert

A lawyer or compliance lead who reviews open-source projects before a company uses or contributes to them. Added by the owner, 2026-10-26; to run.

- **Where:** the repository (licence, `package.json` and the lockfile, README, About), the site (the visit counter, the share links). **Time:** 30 minutes
- **Goals:** say whether a company could use, fork or contribute to it, and what the owner should fix first
- **Asks:** Is the licence clear, and does it cover the code, the docs and the Presets? Are the dependencies' licences compatible (a licence scan of the lockfile)? Who owns code written with an AI agent, and is that stated? Are third-party names (the Synido TempoPAD C16, Chrome, Safari) used fairly? Does the visit counter (GoatCounter) need a privacy note, and is the one in the README enough? Is there a contributor agreement, or does it need one?
- **Success:** a list of risks, ranked, each with the file and the fix

## To do

- [x] Choose the personas (owner, 2026-10-26: profiles 1 to 4 the owner's, 5 to 7 completing them)
- [x] Each persona's review: what they tried, what worked, what stopped them; the findings to the inbox (2026-10-26, 33 lines). The reports: [`docs/reviews/2026-10-26/`](../reviews/2026-10-26/). Their screenshots stayed in the session's scratch folder and are not kept
- [ ] The owner taps through the real LinkedIn link once on a phone (the in-app browser)
- [ ] The Learner's second run, once the tutorials are built (issue 40)
- [ ] The code review, since the first commit; the findings to the inbox
- [ ] Profile 11's review (the open-source legal expert)
