# 163: Bead in About

**What to build:** The owner's idea (inbox, 2026-10-31): "Add Bead to the About screen." Since issue [150](./150-bead-shown-by-default.md) (night/2026-10-31) Bead comes onto the page by itself, so a visitor meets a water drop that About, the page's own introduction, says nothing of. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** [150](./150-bead-shown-by-default.md), whose rules (Display's switch lasting, the Notes for the visit, never with the switch Off) this line describes

**Status:** ready-for-agent · enhancement

## Decisions

Decided by the owner, 2026-10-31:

1. **About names Bead.**
2. **Bead stands beside About's logo, bigger than on the synth;** a click on it gives its tricks and the rest: "I thought of having Bead next to the logo, bigger than on the synth. If we click on it, you can indeed have info on its tricks, etc."

Claude's call, open to the owner:

3. **Beside the logo:** Bead drawn at twice its size on the page, standing on the logo's baseline to its right, idle as it is on the synth (blinks, its tail, now and then a small trick), with reduced motion still.
4. **A click (or Enter, or a tap)** opens Bead's card in place of About's credits: who it is in a sentence, what it answers (what you play, every knob, a tickle), its funny turns in a short list, how to send it away (Display's switch, for good; B, E, A, D, for the visit), and "All its secrets" linking to [bead.md](../bead.md) on GitHub. Back (or Escape) returns to the credits. Bead in About is a button with the name "Bead, Limpide's water drop: its tricks".
5. **With Bead switched Off it is not there,** in About as on the page (150, decision 9: some people would be annoyed); About is then as today.
6. **About's first screen** keeps its way in (the Demo and Tour buttons) on a 393 × 659 phone.

## Agent Brief

**Category:** enhancement
**Summary:** Bead stands beside About's logo, bigger than on the synth, and a click on it shows its tricks.

**Current behavior:** About shows the logo, the name, the tagline and the credits; Bead, which now comes onto the page by itself, is not there.

**Desired behavior:** With Bead's switch On, Bead stands beside About's logo at twice its page size, idle as on the synth (still with reduced motion). It is a button: a click, Enter or a tap opens Bead's card in place of the credits (who it is, what it answers, its funny turns in short, how to send it away for good or for the visit, a link to all its secrets on GitHub); Back or Escape returns to the credits. With the switch Off, About is as today. The Demo and Tour buttons stay on About's first screen at every width.

**Key interfaces:**
- The About panel's header and credits
- Bead's drawing and idle motion, and its stored switch
- The repository's bead.md page

**Acceptance criteria:**
- [ ] With Bead On, About shows Bead beside the logo, larger than on the page
- [ ] A click, Enter or a tap on it shows Bead's card; Back and Escape return to the credits
- [ ] With Bead Off, no Bead in About
- [ ] Reduced motion: Bead still in About
- [ ] On a 393 × 659 phone the Demo and Tour buttons are still on the first screen
- [ ] The About and mascot specs cover it; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- Bead's behaviour on the page
