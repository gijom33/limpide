# Review 7: the recruiter, then the hiring manager

Run on 2026-10-26 against the live site (version 1.8.1, build 2ba9f3a) and the public GitHub pages, with fresh browser contexts and empty storage. I played two people, two minutes each:

- **The recruiter:** iPhone-sized WebKit, 393 × 852. Not technical, came from a LinkedIn post.
- **The hiring manager:** Chromium on a laptop, 1440 × 900. Technical, skims.

GitHub did not block the headless browser, so both GitHub visits used real pages. I also read the README and the owner's profile with `gh`.

Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/`.

## First impression

**Recruiter (phone):** "Dark, slick, looks like a real music app. A card in the middle says *Limpide, a subtractive synthesizer that shows you what each stage does to the sound*. I don't know what 'subtractive' means, but I can tell it's a music thing for learning. There's a big orange 'Play the Demo' button. And there's the name I wanted: *Made by Guillaume Boillet*, with a version number and a date, so it isn't abandoned." (r01-site-first.png)

**Hiring manager (laptop):** "This looks like a commercial plugin UI. It has four colour-coded panels (Oscillators, Filter, Amp, LFO & Envelopes), each with live scopes and spectra. A welcome card gives a one-line pitch, a version and build hash linking to the commit, MIT licence and a GitHub link. This is past the prototype stage." (m01-site-first.png)

## What they tried

### Recruiter (phone, WebKit)

1. Landed on the site and the welcome card showed (r01-site-first.png). The card answers "what" and "who" straight away. "Made by Guillaume Boillet" is plain text, not a link.
2. Tapped **Play the Demo**. The page scrolled into the panels and the patch changed to "Kick". Moving orange and purple spectrum bars and pulsing envelope curves played across Filter, Amp and LFO & Envelopes (r02-demo-playing.png, r03-scroll.png). It looks alive. The labels (Cutoff, Resonance, Key Track, "+2.8 oct", dB scales) mean nothing to this reader, but it reads as "serious tool".
3. Scrolled back up and tapped **About** (r04-about.png). It is the same card with a Close button. The only links are the build hash and "Source on GitHub". There is nothing about the author beyond the name: no LinkedIn, no website, no email, no "why I built this".
4. Tapped through to **GitHub** (r05-github-phone.png). The page shows "gijom33 / limpide", the same one-line description, topic tags (react, typescript, web-audio…) and **1 star**. The latest commit reads "**gijom33 and claude**, 11 minutes ago". The recruiter notices "claude" but does not know if that is a person or an AI.
5. Scrolled the README on the phone (r06-github-phone-scroll.png, r07-github-phone-scroll2.png). It is a wall of text with no picture. Jargon follows straight away: "cycle-locked Scope", "Harmonics", "Ideal Reference", "Effective Cutoff". Further down come install commands and a test table. The README ends with "MIT © Guillaume Boillet". Gave up there.

### Hiring manager (laptop, Chromium)

1. Landed on the welcome card over the full four-panel layout (m01-site-first.png).
2. Clicked **Play the Demo** (m02-demo.png). All four panels animate together: oscillator noise, the filter response curve over the spectrum, the amp waveform, and the envelope timeline. Every knob shows its value with units. This is impressive at a glance.
3. Opened the **GitHub repo** front page (m03-github.png). Things a manager reads quickly:
   - 205 commits, 1 branch, the latest commit 12 minutes ago with a green check (CI passes).
   - TypeScript 92%.
   - Folders `e2e`, `docs` and `.github/workflows`, plus `CONTEXT.md`.
   - **Contributors: 2, "claude Claude" and gijom33.**
   - The latest commit is "gijom33 and claude".
4. Read the top of the README (m04-readme-top.png) and the "How it's built" section. The stack is TypeScript, React and Vite on native Web Audio nodes, with no audio libraries. It links to `CONTEXT.md` (a vocabulary), `docs/adr` (architecture decisions) and `docs/issues` (vertical slices built in order). Every push is tested and deployed by a workflow. To this reader that shows method: ADRs, a domain glossary, issue slicing, unit, engine and e2e tests, CI/CD.
5. Clicked through to the **owner's profile** (m05-profile.png). It shows only "gijom33", San Francisco Bay Area, and the pinned repo, which is the profile's only pinned project. There is no full name, bio, link or LinkedIn. The contribution graph is empty until October 2026 ("Created 199 commits in 1 repository" in October). The repo card shows "Built by" with the Claude avatar and the owner's avatar.

## What worked

- **The welcome card does the recruiter's job in one screen.** It says what the app is, who made it, that it is free and open source, and that it is current (version and date). (r01-site-first.png, m01-site-first.png)
- **"Play the Demo" is the right first button for a non-musician.** You see something happen without needing to know anything.
- **It looks finished.** On the laptop it looks like a commercial product. On the phone it reflows into stacked panels with a tab bar (OSC / FILTER / AMP / LFO & ENV), and nothing looked broken.
- **For the hiring manager, the repo signals discipline:** 205 commits, CI green, three test layers, ADRs, a glossary and a deploy workflow, all named in the README's "How it's built".
- **The AI's part is not hidden on GitHub:** Claude is a listed contributor and co-author on the latest commit.

## Where they got stuck or gave up

- **The author's and the AI's parts are not stated in words anywhere.** Neither the site's About nor the README says how the app was made with an AI, or what the author did: product decisions, specs, review, design. The recruiter saw "gijom33 and claude" and could not tell what it meant. The hiring manager worked it out from the Contributors box. They were left to guess the split, and on LinkedIn they would ask "did he write this or did Claude?" (m03-github.png, r05-github-phone.png)
- **No way to reach the author.** "Made by Guillaume Boillet" is plain text. The GitHub profile has no name, bio or links. The README only has "MIT © Guillaume Boillet". A recruiter who liked it has no click to a LinkedIn profile or website. (r04-about.png, m05-profile.png)
- **The README is unfriendly on a phone for a non-musician.** It has no screenshot or GIF, and the first bullets are jargon ("cycle-locked Scope", "Ideal Reference", "Effective Cutoff"). The recruiter gave up in the install and test commands. (r06-github-phone-scroll.png)
- **The GitHub profile undersells the author.** It shows a handle, no name, and a contribution graph that is empty for eleven months and then spikes in October. (m05-profile.png)

## The one sentence

- **Recruiter:** "Guillaume Boillet built and shipped a polished, free music-learning web app on his own, apparently with help from an AI called Claude. I'd need his LinkedIn to know more."
- **Hiring manager:** "Guillaume Boillet shipped a production-quality, well-tested TypeScript and Web Audio app with real engineering process (ADRs, a glossary, CI, e2e tests), co-written with Claude. It shows he can drive an AI to a finished product, but I can't tell from the pages how much of the code and design is his."

## Would they

| | Recruiter | Hiring manager |
|---|---|---|
| **Like** | Yes. It looks great and the demo moves. | Yes. The UI polish and the repo hygiene are both visible in seconds. |
| **Share** | Maybe. They would share the LinkedIn post, not the site; they can't explain it in their own words. | Yes, to a team: "look at this AI-assisted side project". |
| **Come back** | No. Nothing for a non-musician to come back for. | No for the app. Yes to the repo if they were evaluating him. |
| **Recommend** | Not to musicians, since they can't judge it. They would mention the author to a colleague. | Yes, as a portfolio piece worth a look. |
| **Reach out** | Wanted to, but found no link to click. They would have to search LinkedIn by name. | Possibly. They would want to ask how the work was split with Claude, but the same missing link applies. |

## Three findings, ranked

1. **No AI credit in words:** the About and the README never state how Limpide was built with Claude or what the author's own part was; visitors infer it from "gijom33 and claude" on GitHub. Add one honest line in each, e.g. "Designed and directed by Guillaume Boillet, code written with Claude". Screenshots: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/m03-github.png, /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/r04-about.png
2. **No contact path:** "Made by Guillaume Boillet" in the About is plain text, and the GitHub profile has no name, bio or links. Link the name to LinkedIn or a site, and fill in the GitHub profile's name, bio and link. Screenshots: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/r04-about.png, /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/m05-profile.png
3. **README has no picture and opens with jargon:** on a phone, LinkedIn visitors meet a wall of text ("cycle-locked Scope", "Ideal Reference"). Add a screenshot or GIF under the tagline and a plain-words line before the feature list. Screenshot: /private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/7-recruiter/r06-github-phone-scroll.png
