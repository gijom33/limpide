# Inbox

Bugs and ideas as they come up, one line each, before anyone decides what to do with them. Add the screen size and browser when it matters. Triage moves a line out: into a numbered issue in [issues](./issues/), into an existing issue's checklist, or into the dropped list with a reason. GitHub Issues stay for visitors.

## Bugs

- The Envelope Timeline replays the whole 30 s Modulation history for every pixel column, every frame (`timeline.ts:54` → `modulationAt` → `envelopeLevel`): draw time grows from 3.7 to 31 ms a frame after 600 Notes and stays there in silence; 35 fps in the Demo on an M2, 6.6 with the CPU slowed 4× (review [9](./reviews/2026-10-26/9-ts-react-webaudio.md))
- Firefox, unverified: `cancelAndHoldAtTime` (`synthEngine.ts:217`, `:395`, `:400`) may be missing there, in which case no Note sounds; Firefox is not installed for Playwright here, so it was not tried (review [9](./reviews/2026-10-26/9-ts-react-webaudio.md))
- A blank page when the browser refuses site storage: `main.tsx:7` and `App.tsx:534`, `:536` read `localStorage` outside `safeStorage()`, and there is no error boundary (review [9](./reviews/2026-10-26/9-ts-react-webaudio.md))
- The MIDI permission prompt shows 0.7 s after load, before anything is touched, on desktop Chrome (`App.tsx:500`): ask when the MIDI panel opens, or connect at load only if already granted (review [9](./reviews/2026-10-26/9-ts-react-webaudio.md))
- The Filter Envelope's Release fader wraps alone onto a second line, and the Osc tabs drop below their heading, at 1331–1434 px (1366 × 768 included, where the page then scrolls), 601–603 px and 345–369 px (review [3](./reviews/2026-10-26/3-ui-maniac.md))
- Inner margins still differ outside 2 × 2: on phones the stages have 12 px and LFO & Envelopes 16 px; at 861–960 px 8 against 16 (review [3](./reviews/2026-10-26/3-ui-maniac.md))
- The MIDI panel opens centred on the header, not under its button: 271 px away at 1440, 831 px at 2560; at 690 it ends left of its own button (review [3](./reviews/2026-10-26/3-ui-maniac.md))
- At 861–879 px the Timeline's "Effective Cutoff" legend runs 17 px past the content edge; Viewer labels collide with traces at every width ("−48 dB" crossed by the curve, "1k" under the Harmonic bars); the Patch name slides 6 px when its changed dot appears; 20 more nitpicks in the review (review [3](./reviews/2026-10-26/3-ui-maniac.md))
- Focus drops to the page body when a panel closes (a Preset loaded, Escape in the Patch or Display panel, Explore or Play the Demo in the welcome): the next Tab skips the header (WCAG 2.4.3) (review [6](./reviews/2026-10-26/6-accessibility.md))
- Import file can't be reached by keyboard: a hidden file input inside a label (WCAG 2.1.1) (review [6](./reviews/2026-10-26/6-accessibility.md))
- Space on a focused button or option freezes the Viewers instead of pressing it (deliberate, `App.tsx:552`, but against the button and radio keyboard patterns, WCAG 2.1.1): a decision to revisit (review [6](./reviews/2026-10-26/6-accessibility.md))
- Pads and keys Presets play one Note at a time: 7 of the 9 Pads, Organ, Electric Piano, Marimba, Glass Keys, Harp and Clav are at 1 Voice (review [2](./reviews/2026-10-26/2-synth-enthusiast.md))
- The MIDI Mappings list names a Parameter without its section ("Amount", "Depth"), so two same-named controls can't be told apart (review [2](./reviews/2026-10-26/2-synth-enthusiast.md))
- A share link drops the Patch name: it opens as "Shared Patch" (review [2](./reviews/2026-10-26/2-synth-enthusiast.md))
- The MIDI Next and Previous Preset actions are untested: swapping them (`App.tsx:417`) passes every unit, engine and e2e test (review [8](./reviews/2026-10-26/8-oss-sceptic.md))
- Docs drift: the PRD says "Limpide (formerly Limpide)" (line 11), still lists tooltips as out of scope and promises one smoke test; ADR-0007's consequences contradict each other on the Amp Tap's default; ADR-0001 still promises the Ghost; `CONTEXT.md` names six Presets; `synthEngine.ts:15` says the newest Note is the default Amp Tap source, where it is `'all'` (review [4](./reviews/2026-10-26/4-ai-expert.md), [8](./reviews/2026-10-26/8-oss-sceptic.md), [10](./reviews/2026-10-26/10-methodology.md))
- CI runs only the unit tests and the build (`.github/workflows/deploy.yml`), while the README says every push to main is tested: the engine and e2e suites never run there (review [4](./reviews/2026-10-26/4-ai-expert.md))

## Ideas

- The Demo on a phone: a plain-words caption of what is happening ("Acid: the filter opens and closes"), the sound's name kept in view while the header is slid away, some sign of progress, and a word when a key tap stops it (review [1](./reviews/2026-10-26/1-curious-contact.md))
- Explanations on touch screens: tooltips open only on hover or focus (`Tooltip.tsx`), so a phone never explains a control; a long press, or an ⓘ per section (review [1](./reviews/2026-10-26/1-curious-contact.md))
- Tooltips for the core controls and the Viewers (Cutoff, Resonance, Waveform, Octave, Semitone, the stage headings, each Scope, Spectrum and the Timeline), and the Viewers' names on screen, since other tooltips use them (review [5](./reviews/2026-10-26/5-learner-teacher.md))
- A visible signal chain and a "start here" after the welcome; the best teaching aids (the Curve's tooltip on Resonance, Maths, Ideal, Snapshot) are hidden in the Display panel. For issue 40 (review [5](./reviews/2026-10-26/5-learner-teacher.md))
- Projector-sized reading: Maths formulas and Viewer axis labels about 10 px at 1920 × 1080; the Timeline's Filter Envelope and Effective Cutoff are two similar oranges (review [5](./reviews/2026-10-26/5-learner-teacher.md))
- The welcome's "A subtractive synthesizer…" is jargon for a non-musician; the red struck-through MIDI icon reads as an error on an iPhone, where MIDI never works (review [1](./reviews/2026-10-26/1-curious-contact.md))
- MIDI keyboards: pitch bend, the sustain pedal (CC 64) and program change; the mod wheel to something by default; MIDI Learn able to take pitch bend (review [2](./reviews/2026-10-26/2-synth-enthusiast.md))
- Synth features asked for: LFO tempo sync and an Amp (tremolo) destination; the mouse wheel turning knobs; a gentler Glide taper (Off to 6 ms in the first 40 px); Quick Setup starting at Cutoff (review [2](./reviews/2026-10-26/2-synth-enthusiast.md))
- The Viewers' text alternatives: canvases with a role so their labels are read, the Timeline in the accessibility tree, the LFO plots described (WCAG 1.1.1) (review [6](./reviews/2026-10-26/6-accessibility.md))
- Keyboard comfort: arrow keys within a radio group (one Tab stop), Home, End and Page Up on knobs and faders, the new Preset announced after Next or Previous (WCAG 4.1.3), distinct slider names across the two Envelopes and LFOs (WCAG 2.4.6) (review [6](./reviews/2026-10-26/6-accessibility.md))
- Say how it was built: a "How this was built" section in the README (PRD → issues → ADRs → inbox, Claude Code and the AI Hero skills, what the owner decided) and one honest line in About (review [4](./reviews/2026-10-26/4-ai-expert.md), [7](./reviews/2026-10-26/7-recruiter.md))
- The README for a LinkedIn visitor: a screenshot or GIF under the tagline, a plain-words line before the feature list (review [7](./reviews/2026-10-26/7-recruiter.md))
- A way to reach the author: link "Made by Guillaume Boillet" in About to LinkedIn or a site; fill in the GitHub profile's name, bio and link (the owner's to do) (review [7](./reviews/2026-10-26/7-recruiter.md))
- Ready for contributors: CONTRIBUTING, a bug-report template, a code of conduct (the community profile is at 42 %); a linter and formatter run in CI (three `eslint-disable` comments silence an ESLint that isn't installed; a duplicate import in `App.tsx`) (review [8](./reviews/2026-10-26/8-oss-sceptic.md))
- Split `App.tsx` (963 lines, 27 `useState`, 17 `useRef`, 19 `useEffect`, touched in 70 of 206 commits) into hooks per concern, and test the MIDI actions (review [8](./reviews/2026-10-26/8-oss-sceptic.md), [9](./reviews/2026-10-26/9-ts-react-webaudio.md), [10](./reviews/2026-10-26/10-methodology.md))
- Process: run the code review at each minor version; ADRs with a status, a date and who decided, reversed by a new ADR rather than edited; commits prefixed with their issue (or "no issue: why"); inbox lines committed before triage; tags and GitHub Releases for versions; shorter commit subjects (review [4](./reviews/2026-10-26/4-ai-expert.md), [10](./reviews/2026-10-26/10-methodology.md))

## Dropped

## Triaged

2026-10-25: every line went to [29](./issues/29-phone-header.md) (the phone header), [30](./issues/30-small-fixes.md) (small fixes), [31](./issues/31-lfo-retrigger.md) (LFO retrigger) or [32](./issues/32-more-presets.md) (more Presets).
2026-10-25, later: the strip's jump bringing the header back went to [29](./issues/29-phone-header.md); tighter rows in the Oscillators and Amp to [33](./issues/33-tighter-rows.md).
2026-10-25, evening: the call to play a Note to start the sound went to [35](./issues/35-play-to-start.md).
2026-10-25, night: the MIDI messages channel first ("ch 2 · CC 7 · 100", and the Mappings "ch 1 · CC 74"), done at once; the Hold rhythm test found flaky when both browsers run at once, logged under Bugs.
2026-10-25, late night: a default C16 mapping when plugged in went to [34](./issues/34-c16-bank-layout.md), already planned and waiting for the C16's messages; one width for every curve to [37](./issues/37-curve-widths.md).
2026-10-25, near midnight: the three flaky timing tests and the contrast test caught mid fade-in, fixed at once. Under load the test's own calls arrive up to seconds late, after the Filter Decay (0.25 s) or the Glide (1.1 s) is over, and they stretch the Hold taps (a gap over 2 s switches Hold off), so the timed part now runs in the page. The test browsers hold the sound back, so the invitation is always there: the audit waits for its fade-in to end.
2026-10-25, before midnight: the in-between layout for foldables went to [38](./issues/38-in-between-layout.md); multi-touch on the piano to [39](./issues/39-multi-touch-piano.md); a tutorial per Preset to [40](./issues/40-preset-tutorials.md), to grill first since the PRD leaves guided lessons out; the hiss at high Resonance and Cutoff to [41](./issues/41-resonance-hiss.md), a diagnosis first; the persona reviews and the AI Hero code review to [42](./issues/42-reviews.md).
2026-10-26: a four-across layout for wide screens went to [43](./issues/43-four-across.md).
2026-10-26: the knob test that timed out in WebKit, fixed at once. A hundred round trips (a turn, a read, a look at every knob, twenty times for five knobs) took 33 to 43 s under 8 workers and passed 60 s under a full run; the turning and looking now run in the page, one round trip a knob, 7 to 9 s under the same load, and the test still fails when a value can resize its knob.
2026-10-26: the header on the wider layouts (the phone's structure and piano for 2 × 2, a bigger piano and one order of buttons everywhere) went to [44](./issues/44-header-across-layouts.md), decisions open.
