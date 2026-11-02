# 163: Bead in About

**What to build:** The owner's idea (inbox, 2026-10-31): "Add Bead to the About screen." Since issue [150](./150-bead-shown-by-default.md) (night/2026-10-31) Bead comes onto the page by itself, so a visitor meets a water drop that About, the page's own introduction, says nothing of. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** [150](./150-bead-shown-by-default.md), whose rules (Display's switch lasting, the Notes for the visit, never with the switch Off) this line describes

**Status:** done (2026-11-01). Built on night/2026-10-31, shipped in 1.20.0, seen by the owner: "Yes, it's there." Its size and place change in [178](./178-bead-in-about-at-its-own-size.md).

## Decisions

Decided by the owner, 2026-10-31:

1. **About names Bead.**
2. **Bead stands beside About's logo, bigger than on the synth;** a click on it gives its tricks and the rest: "I thought of having Bead next to the logo, bigger than on the synth. If we click on it, you can indeed have info on its tricks, etc."

Claude's call, open to the owner:

3. **Beside the logo:** Bead drawn at twice its size on the page, standing on the logo's baseline to its right, idle as it is on the synth (blinks, its tail, now and then a small trick), with reduced motion still.
   **Since then (2026-11-01, issue 178):** Bead stands at its size on the page, its foot level with the bottom of the logo's mark, the mark and Bead centred together; decided by the owner (the size and place), the centring Claude's call.
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
- [x] With Bead On, About shows Bead beside the logo, larger than on the page
- [x] A click, Enter or a tap on it shows Bead's card; Back and Escape return to the credits
- [x] With Bead Off, no Bead in About
- [x] Reduced motion: Bead still in About
- [x] On a 393 × 659 phone the Demo and Tour buttons are still on the first screen
- [ ] The About and mascot specs cover it; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- Bead's behaviour on the page

## How it was built

- **Beside the logo:** while Display's switch is on, Bead stands on the logo's baseline to its right, 88 × 52 px (twice its 44 × 26 on the page), the logo still in the middle over the name. It is drawn from the page's own pixels and lives in the stylesheet alone, so it costs no frame of the render loop: it blinks, glances left and right, and now and then jiggles, wags its tail or hops; with reduced motion it stands still. It sits outside the flow, so About's height, and its first screen on a phone, are as before.
- **The card:** Bead is a button named "Bead, Limpide’s water drop: its tricks". A click, Enter or a tap shows its card in the credits' place, scrolling there as the credits do: its name and Back, who it is, what it answers, four funny turns, how to send it away (Display's switch for good; B, E, A, D for the visit), and "All its secrets", linking to bead.md on GitHub. Back or Escape return to the credits, the focus back on Bead; a second Escape closes About, which opens on the credits next time. With the switch off, About is as before.
- **Claude's calls, open to the owner:**
  1. **Its idle life is a loop in the stylesheet, not the page's Bead:** the blink, the glances and three small tricks (a jiggle, a tail wag, a hop) come round on cycles of 7 to 13 seconds, rather than its whole life from the page (its strolls, its props, dozing). Cheap, and it never wanders off the logo.
  2. **Bead again closes its card too** (the button says it is expanded while the card shows), besides Back and Escape. A phone's back gesture, which comes to the dialog as a close request, goes back to the credits first, as Escape does.
  3. **In About whenever the switch is on**, even after B, E, A, D sent it away for the visit: decision 5 ties it to the switch alone.
  4. **Narrower than 340 px** (About fits windows down to 280 px), the logo and Bead are centred together, as the logo alone leaves too little room for its tail.
  5. **The card's words** (decision 4's list): "Limpide’s water drop, its tail the logo’s stroke: it lives on the page, on a section’s top edge, and makes no sound. It dances to what you play, answers every knob and fader you turn, giggles when you tickle it with the mouse and sprays droplets when clicked. Left alone a while, it does a funny turn now and then:" a glass of water, then a burp; a rain cloud and a big umbrella; a water gun, a fountain show; fishing off its edge for a ♪. "To send it away: Display’s Bead switch, for good; or play B, E, A, D (J, D, H, S on the computer keyboard) for this visit, and again to call it back." bead.md's opening and CONTEXT.md's Mascot now say About shows a few of its tricks.
- **Tests:** `e2e/about.spec.ts` (twice its page size on the logo's baseline; it fits at 280, 320, 340 and 375 px; the card by click and Back, by Enter and Escape; a tap on a 393 × 659 phone at the welcome, Demo and Tour on the first screen with the credits or the card; animations, none with reduced motion; none with the switch off), `e2e/mascot.spec.ts` (Display's switch turns it on and off in About), and the design audit opens About with Bead's card, at every size in both themes. They pass in Chromium and WebKit on the Mac, with the welcome and keyboard-access specs; Linux's fonts are left to GitHub's run, so the last criterion stays open until then. Bead's frame-cost test failed now and then on a machine under load (1.2 to 1.9 ms against 1 ms), as often with Bead kept out of About, which adds nothing to the page's frames: About's Bead is drawn by the stylesheet, only while About is open.
- **Found on the way:** narrower than a phone (280 px), WebKit now and then lost a click on Display's Bead switch, at the panel's foot below the window; the audit turns the switch with the keyboard. Not looked into further.
- **To try:** open About (the ⓘ, or the logo): Bead beside the logo, blinking, now and then a hop. Click it, then Back; press Escape on the card, then again. On a phone, tap it. Turn Bead off in Display: About has no Bead. With reduced motion, it stands still.
