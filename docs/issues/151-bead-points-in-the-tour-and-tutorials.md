# 151: Bead points the way in the Tour and the Tutorials

**What to build:** The owner's idea (inbox, 2026-10-31): "Have Bead help focus on right element during the tour and tutorials." Today a Tutorial Step rings its control, with its target above it ("→ 800 Hz"), and marks its section in a phone's strip; the Tour's cards mark their Section's Viewers while the synth turns their controls. Bead ([115](./115-an-easter-egg.md)) now also goes to that control, clings at its side like a drop on glass and points at it, so a newcomer finds the right knob at once.

**Blocked by:** [150](./150-bead-shown-by-default.md) (Bead shown by default), since otherwise most people taking the Tour have not met Bead

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Fine."

## Decisions

Decided by the owner in a grilling, 2026-10-31 (Claude's recommendations, each accepted):

1. **In v1,** as Bead's polish, after 150 ("Yes, v1").
2. **What Bead points at:** in a Tutorial, the Step's ringed control, the Display button and the Snapshot button included when a Step asks for them. In the Tour, one control per card: the one the card watches, or else its first move's. The Viewers are left to the card's own marking.
3. **Where it stands:** clinging at the control's side, like a drop on glass, not on an edge: on the side with the most free room, so it covers the fewest neighbouring names; the side away from the card when both are equal. Never over the ring or the target text above the control.
4. **The gesture:** it faces the control, looks at it and points its tail at it; one small bounce on arriving and at each new Step; otherwise still, but for blinking.
5. **Never in the way:** while it points, the pointer passes through Bead to what is under it (no tickle, no spray). Back on its edge, it takes the pointer again.
6. **Its way there and back:** its usual move to the control's Section (a stroll, a leap, a fall), then a slide down from the edge onto the panel to the control's side; between two controls of one Section, a slide across without climbing back. It stays with the control if the page scrolls or the layout changes. When the Tour or Tutorial ends, a hop back up to its edge.
7. **Out of reach** (a control in the Display panel, under the docked card, or on a phone's hidden tab): it stays where it is and looks towards it, and goes there once the control is in view (the tab switched, the panel opened, the card moved).
8. **The ring stays** exactly as it is: Bead adds to it, never replaces it, so a screen reader, reduced motion and Bead switched off lose nothing.
9. **Its own life meanwhile:** its funny turns, its visits to other Sections every 15 to 40 s and its dozing pause until the Tour or Tutorial ends. It still answers the knobs and faders.
10. **A Step done:** a happy hop, then on to the next Step's control; a Tutorial finished gets a bigger turn, the fountain. The Tour has no "done", so nothing like it there.
11. **Bead off or away** (its Display switch off, or sent away by B, E, A, D): the Tour and the Tutorials do not call it; only the ring.
12. **Reduced motion:** Bead never moves, so it turns its eyes and tail towards the control at each Step, without the hops.

## Agent Brief

**Category:** enhancement
**Summary:** During a Tutorial or the Tour, Bead goes to the control the Step or card is about, clings at its side and points at it, adding to the ring that marks it.

**Current behavior:** A Tutorial Step rings its control and writes its target above it; a Tour card brings its Section into view and marks its Viewers while the synth turns its controls. Bead goes on with its own life on the Sections' top edges: strolls, funny turns, visits to other Sections, dozing.

**Desired behavior:** While a Tutorial or the Tour is open and Bead is out, Bead goes to the control of the current Step (or, in the Tour, the card's watched control, else its first move's) by its usual moves, slides down from its Section's edge onto the panel, and clings at the control's side, on the side with the most free room (the side away from the docked card when equal), never covering the ring or the target text. It faces the control and points its tail at it, bouncing once on arriving and at each new Step. While it points, the pointer passes through it. A control out of reach (the Display panel, under the card, a hidden tab) gets a look from where Bead is, until it comes into view. A Step done gets a hop, a Tutorial finished the fountain. Its funny turns, visits and dozing pause meanwhile; it still answers the knobs. When the Tour or Tutorial ends, it hops back up to its edge and its own life resumes. With Bead off or away nothing of this happens; with reduced motion only its eyes and tail turn towards the control.

**Key interfaces:**
- The Tutorial card's ringing of a Step's control, and the Tutorial state (the current Step, a Step done, a Tutorial finished)
- The Tour card's current card, its watched control and its moves
- Bead's motion (its ground, its moves between Sections, the new clinging place beside a control), its tricks deck, its pointer handling, its reduced-motion rule
- The docked card's placement (for the side away from it and for "under the card")

**Acceptance criteria:**
- [ ] A Tutorial Step on a knob: Bead ends beside that knob, its tail towards it, the ring and target text uncovered
- [ ] The next Step on another control of the same Section: Bead slides across; on another Section's: its usual move, then the slide down
- [ ] The Tour: one control per card, the watched one or the first move's
- [ ] A click on a control under Bead while it points reaches the control
- [ ] A control in the Display panel or on a hidden tab: Bead looks towards it, and goes once it is shown
- [ ] No funny turn, visit or doze while a Tour or Tutorial is open; Bead still answers a knob turned
- [ ] A Step done: a hop; a Tutorial finished: the fountain
- [ ] Closing the Tour or Tutorial: Bead hops back to its edge and its own life resumes
- [ ] Bead off or away: nothing but the ring; reduced motion: only its eyes and tail turn
- [ ] Unit tests for where Bead clings (the side chosen, nothing covered); the mascot spec covers a Tutorial and the Tour, in both browsers; Bead's frame-cost test passes as before; every test passes in Linux's fonts too

**Out of scope:**
- Words of Bead's own in the Tour or the Tutorials
- Pointing at the Viewers
- Bead during the Demo (it dances as now)

## How it was built

Built on 2026-11-01, on night/2026-11-01.

- **Where it clings** is worked out apart from the page (`clingBeside`): level with the control, its tail's tip just short of the ring, on the side covering least of the neighbouring controls and names, the side away from the docked card when both cover as little; never over the ring, the target text (estimated from its length) or a card or panel, never off the window or under a phone's sticky header and tabs. With neither side free it does not cling and looks from where it is.
- **Its moves** gain a slide and a cling (`createMascotPlace`): a slide down, up or across the panel, easing in, then clinging where the control is, following it as the page scrolls. Leaving, it flies or falls back to an edge as from any line.
- **The page** (`Mascot`) is given a guide by the Tutorial or the Tour: the control to point at, the Display button as its stand-in, the Step, the Step made, the Tutorial finished. The Bead first goes to the control's Section's top edge over it, then slides down; from beside another control of that Section it slides across; with that edge out of view it slides straight there. It bounces on arriving and at each new Step, hops when a Step is made, and plays the little fountain when a Tutorial is finished. Its tricks, visits, rides, strolls, dancing and dozing pause; it still answers the controls, words and the theme. With reduced motion it stays on its edge, facing the control, its tail aimed at it. While it slides or clings, the pointer passes through it.
- docs/bead.md has a section on it. Tests: unit tests for the cling (sides, the card, nothing covered), the slide and the paused life; the mascot spec covers a Tutorial (the hop, the slide across, the Display button, another Section, Quit), a hidden tab, a finished Tutorial's fountain, the Tour, reduced motion and a phone, in Chromium and WebKit.

**Calls made (Claude's call, open to the owner):**

1. **The Tour's control** is each card's first move's: since issue 158 no card watches a control of its own. So the Oscillators card points at Osc 1's Waveform, the Filter at the Cutoff, the Amp at the Amp's Attack, the LFOs at LFO 1's Depth.
2. **The Display panel open** counts as out of reach: Bead is drawn under the panels, so it stays beside the Display button and looks at the option. Once the option is on, the ring goes, and it stays beside the button until the next Step.
3. **Out of reach** it stays beside the last control while that is still in reach; otherwise (a control scrolled off the window, as the Amp's Attack can be on the Amp card at 1440 × 900, where the card brings the Envelope Timeline first) it goes back to its edge and looks from there, rather than hang beside nothing.
4. **The Display button** is outside the Sections: Bead's way there is the top edge of the Section under it, then a slide up beside it. On a phone and in 2 × 2 the header covers Bead, so the button is out of reach there and it looks at it.
5. **Still, beside the control:** the sound no longer hops, leans or stretches it, and it does not dance while a Tutorial or the Tour is open, even looking from its edge; the controls still move it (the Tour's own turning included), and a word or the theme still plays its trick.
6. **The finished card** keeps it beside the last Step's control, doing the fountain, until the Tutorial is closed. "The fountain" is the little fountain from the top of its head, not the fountain show.
7. **Sliding,** it stretches a little and leaves drips behind, like a drop running down glass; its slide goes up to 400 pixels a second, so a long one (across a 2 × 2 page) takes a second or two.

**Changed since (2026-11-03, [210](./210-the-tour-tells-of-the-layers-and-the-tutorials.md)):** calls 2 and 3 now hold only where Bead need not turn round to look at the control: its place beside the last control is found clear of text for its facing alone, and turned and aiming it can reach over a label (beside the Display button, turned to the Tour's Tutorial button above and left of it, over About's name). Where it would turn round, it goes back to its edge and looks from there. Claude's call, open to the owner.

**To try in the app:** with Bead out, open the Bass Tutorial at a laptop's size and press Start: Bead leaps to the Oscillators, slides down to Osc 2's level on the Mixer tab and points at it. Press "Do it for me" (a hop), then Next: it slides across to Osc 2's Waveform. Switch to Osc 1's tab: it goes back to its edge and looks; back to the Mixer, it returns. Go on to the Ideal step (beside the Display button) and the Cutoff (a leap to the Filter, then the slide). Quit: it hops home. Then the Tour from About, a Tutorial on a phone, the end of a short Tutorial (FM Ladder, the fountain), and reduced motion.

