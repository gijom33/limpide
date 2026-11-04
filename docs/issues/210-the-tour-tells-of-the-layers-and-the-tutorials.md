# 210: The Tour tells of the layers and the Tutorials

**What to build:** The owner's idea (inbox, 2026-11-03): "I think the tool should also explain all the other layers, the history, the geek layer, and also the fact that you can build your own tutorial preset, right? Rebuild your own tutorial preset." "The tool" is the Tour (the owner, 2026-11-03: "Yes, the tour, sorry."). After the Sections, the Tour says what else there is to find. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-03) on night/2026-11-02, merged into main, not yet released; tried by the owner: "Good."

## Decisions

Decided by the owner, 2026-11-03:

1. **The Tour explains the other layers and the Tutorials:** the Synth Geek Layer, its History lines, and that each Tutorial rebuilds a Preset yourself.

Claude's calls, open to the owner:

2. **At the Tour's end, after the Sections,** and where each is found: the Synth Geek Layer's switch in Display, the History lines in the tips with the layer on, the Tutorials in the Tutorial menu.
3. **One closing card, or one card each,** is the implementer's choice, measured against the Tour's length; each card shows the control it names, as the Sections' cards do ([206](./206-the-tour-shows-the-control-and-the-viewer.md)).
4. **In the Tour's voice,** short, as a neophyte reads it ([129](./129-words-fun-to-read.md)); nothing is switched on for the person.

## Agent Brief

**Category:** enhancement
**Summary:** The Tour ends after the Sections without saying that the Synth Geek Layer, its History lines and the Tutorials are there to find.

**Current behavior:** The Tour walks through each Section, a card each, and ends. Nothing in it mentions the Synth Geek Layer (switched on in Display), the History lines its tips carry, or the Tutorials, in which the person rebuilds a Preset step by step from Init.

**Desired behavior:**
- After the Sections, the Tour tells of the Synth Geek Layer (what it adds, where it is switched on), its History lines (where they show), and the Tutorials (each rebuilds a Preset yourself, step by step; where they are opened).
- Each such card points at the control it names, as the Sections' cards do, on every width.
- The words are short and plain, in the Tour's voice; the Tour switches nothing on.
- The Tour's own steps (Next, Back, Escape, its end returning to About) work as before.

**Key interfaces:**
- The Tour's cards and their order
- Display's Synth Geek Layer switch, the Tutorial menu

**Acceptance criteria:**
- [x] The Tour, after its Section cards, names the Synth Geek Layer, its History lines and the Tutorials, and says where each is
- [x] Each of those cards shows the control it names, on a phone and a laptop
- [x] The Synth Geek Layer is off after the Tour if it was off before
- [x] The Tour's keyboard steps and its end work as before

## How it was built

Built on 2026-11-03, on night/2026-11-02.

- **Two cards after the Sections,** so the Tour has six: the Synth Geek Layer, with its History, then the Tutorials, the last, which keeps "Build a Bass" and "Done". Next, Back, Close and the end back to About work as before.
- **Each rings the control it names and brings it into view** on every width, the header's rows back for it on a phone: the Synth Geek Layer's card rings the Display button, and the Geek toggle itself once the person opens the panel; the Tutorials' card rings the header's Tutorial button. Bead points at each. The Tour opens nothing and switches nothing on: the layer is as the person left it.
- **The words,** card 5, "Synth Geek Layer":
  - "Find the ringed Display button: its Geek toggle, a pair of glasses, turns on the Synth Geek Layer."
  - "The Synth Geek Layer shows the numbers under the hood, for the curious: levels in decibels, the formula behind a wave’s Harmonics, how many times a second each Scope’s wave repeats. It stays off until you switch it on."
  - "With it on, the tips grow too: rest on a control, or hold it with a finger, and most tips end with a History, where the control comes from, the instruments and people it came through."
- **Card 6, "Tutorials":**
  - "Find the ringed Tutorial button: each Tutorial in it has you rebuild one of the Presets yourself."
  - "The Presets are Limpide’s ready-made sounds. A Tutorial starts from Init, a plain sound, and has you build one back step by step: you turn each control, and hear and see what it does."
  - "That is the whole Tour. Now build a sound yourself: Bass goes through the whole chain, one control at a time."
- **Two fixes the cards brought to light:**
  - In WebKit, a docked card that shrank while the page scrolled was lifted off the bottom (the shorter LFO card, 48 px, over the Timeline it points at). Its place is now taken from its fixed bottom. This applies to every docked card.
  - Bead, out of reach of the control it points at, stayed beside the last one and turned round to look, over a label. It happened beside the Display button, turned to the Tutorial button, over About. Now it stays only where it need not turn round; else it looks from its edge. Issue 151 has a dated line on it.
- **Tests:**
  - `src/tutorial/tour.test.ts`: the cards, their order, what each says and shows, and their length.
  - The words test now reads the new cards too.
  - `e2e/tour.spec.ts`: each card's ring, and the Geek toggle's once Display is open, still off. Nothing plays, Back and Next pass between the cards, and the layer is off after Done. At 320, 375 and 1280 px the control is in view, above the card and uncovered.
  - The Tour's existing tests now count six cards.
  - Red first: the view test failed with the scroll taken out.

**Calls made (Claude's call, open to the owner):**

1. **Two cards, not one or three:**
   - One for the Synth Geek Layer, with History inside it, since the History lines are found by the same toggle.
   - One for the Tutorials, the last card.
   - Each names one control, as the Sections' cards do, and Bead points at one control a card. The Tour grows from four cards to six.
2. **The Display button, ringed, stands for the Geek toggle** while Display's panel is shut, as a Tutorial's Display Step does. The Tour does not open the panel itself.
3. **Nothing plays on these two cards:** the phrase stops, so the words are read in quiet, and the Tour's Patch rests. Back to the LFOs card, it plays again.
4. **The last card keeps the way on to Bass:** the line that ended the LFOs card ("That is the whole chain…") moves to the Tutorials card, as "That is the whole Tour…".
5. **"Most tips end with a History":** controls with no musical past have none. The tips are reached by resting on a control, or holding it on a touch screen.
6. **Bead's fix** (above) applies to every guide, a Tutorial's included: with Display's panel open on an option to its other side, it now looks from its edge rather than turning round beside the Display button.

**To try in the app:**
- Take the Tour from About to its end. After the LFOs, the fifth card rings Display. Open Display: the ring moves to the Geek toggle, which is still off. The sixth rings the Tutorial button, and "Build a Bass" starts Bass.
- Try it on a phone too: after the LFOs card, the page comes back up to the header for each.
- With Bead out at a laptop's size, Bead points at Display, then looks at the Tutorial button from its edge.
