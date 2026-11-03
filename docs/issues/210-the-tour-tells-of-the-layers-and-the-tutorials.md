# 210: The Tour tells of the layers and the Tutorials

**What to build:** The owner's idea (inbox, 2026-11-03): "I think the tool should also explain all the other layers, the history, the geek layer, and also the fact that you can build your own tutorial preset, right? Rebuild your own tutorial preset." "The tool" is the Tour (the owner, 2026-11-03: "Yes, the tour, sorry."). After the Sections, the Tour says what else there is to find. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

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
- [ ] The Tour, after its Section cards, names the Synth Geek Layer, its History lines and the Tutorials, and says where each is
- [ ] Each of those cards shows the control it names, on a phone and a laptop
- [ ] The Synth Geek Layer is off after the Tour if it was off before
- [ ] The Tour's keyboard steps and its end work as before
