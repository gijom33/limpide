# 42: Reviews: personas and code

**What to build:** Two looks at Limpide from the outside, each ending in lines for the inbox rather than changes. Personas: the synth judged by several kinds of visitor, each from their own point of view, on the published site. Code: the AI Hero code review (the `code-review` skill) of the whole codebase, against its documented standards and the PRD. From the inbox, 2026-10-25.

**Blocked by:** none (the Learner's second run waits for the tutorials, [40](./40-preset-tutorials.md))

**Status:** profiles chosen (2026-10-26), reviews to run

## Why these profiles

The owner will post Limpide on LinkedIn: the link is the site, [gijom33.github.io/limpide](https://gijom33.github.io/limpide/), and the post may link the repository too. So the personas are the people a LinkedIn post reaches, not only the PRD's learners. Most open the link on a phone, in LinkedIn's in-app browser (no MIDI, sound held back until the page is touched), with little patience: what the first ten seconds show matters. Four profiles are the owner's (1 to 4), three complete them (5 to 7). Issue 42's first ideas went into them: the beginner into 1, the sound designer into 2, the teacher into 5, the screen reader into 6, the phone visitor into 1.

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

## To do

- [x] Choose the personas (owner, 2026-10-26: profiles 1 to 4 the owner's, 5 to 7 completing them)
- [ ] Each persona's review: what they tried, what worked, what stopped them; the findings to the inbox
- [ ] The owner taps through the real LinkedIn link once on a phone (the in-app browser)
- [ ] The Learner's second run, once the tutorials are built (issue 40)
- [ ] The code review, since the first commit; the findings to the inbox
