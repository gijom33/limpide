# Design principles

The rules every screen change is judged against, the way issue 15's audit judged against its layout rules. Each rule names the published principle it comes from, so a disagreement can be settled by going back to the source rather than by taste.

**Who we design for first:** someone opening Limpide for the first time, often from a shared link, often on a phone. In their first ten seconds they should see a real, beautiful instrument and that there is more to explore. Nothing done for them may make the instrument worse for the learner who stays twenty minutes on a laptop.

## Structure

- **The layout is the signal flow** (Gestalt continuity). Oscillators → Filter → Amp read left to right on wide screens and top to bottom on phones; Modulation sits below them, because it acts on them.
- **What belongs together sits together** (Gestalt proximity and common region). A control lives in the block of the stage it changes. A control that only matters with another one sits beside it: Glide, which only acts at one Voice, sits beside Voices.
- **One colour per stage** (Gestalt similarity). A stage's controls, value arcs and Viewers share its colour. Modulation has one colour of its own that no stage uses, so "where it is set" and "where it is now" never look alike.
- **Show more only when asked** (progressive disclosure). The Display panel, the Maths Layer and the MIDI panel hold what a first-time visitor does not need; nothing a first-time visitor needs hides behind them.

## Controls

- **Size follows use** (Fitts's law: time to hit a target grows with distance and shrinks with size). Parameters worth turning while playing get the big knob; set-and-forget Parameters get the small one ([ADR-0008](./adr/0008-knob-size-follows-the-parameter-s-role.md)).
- **Follow hardware conventions** (Nielsen 2: match between the system and the real world). Levels and envelope stages are faders, as on mixing desks and classic synths; everything else is a knob.
- **Every control shows its value in real units** (Nielsen 1: visibility of system status). On phones, where room is short, a value shows only while it changes: above the finger while a finger drags it, in the name's place when something else moves it (keys, MIDI, the Demo).
- **One material for every control** (Gestalt similarity). Knob caps and fader handles are the same raised cap with the same marker line; only the movement differs.
- **Inactive is clearly greyed out.** A control that is adjustable but has no effect right now (Osc 2's tuning while Osc 2 is silent, the Filter Envelope at Amount 0) greys out as a whole, marker included, to 30 %; its name stays readable. WCAG 1.4.11 leaves inactive controls out of its contrast minimum.
- **Every change can be undone in one gesture** (Nielsen 3: user control and freedom). Double-click or double-tap resets a control to its default.
- **Icons carry words where hover cannot** (Nielsen 6: recognition rather than recall). Tooltips explain on a pointer screen; on touch screens icon buttons have a visible label.

## Motion

- **Motion shows the sound, never decorates it.** Something moves on screen only when something moves in the sound: a modulated value, a playhead, a Glide.
- **No glow.** Nothing glows, while dragging or when selected; emphasis comes from size, colour and contrast.
- **Reduced motion is respected** (`prefers-reduced-motion`, WCAG 2.3.3). Live dots and rings stand still at their range; Viewers keep drawing, because they are the content.

## Accessibility (WCAG 2.2 AA unless noted)

- **Contrast:** text at least 4.5:1 against its background (1.4.3); control boundaries, value arcs and modulation rings at least 3:1 (1.4.11). Checked in both themes.
- **Targets:** at least 24 × 24 CSS px everywhere (2.5.8); at least 44 × 44 on touch screens (Apple Human Interface Guidelines, WCAG 2.5.5 AAA).
- **Dragging has a single-pointer alternative** (2.5.7): a value can be set without a drag.
- **Every control works from the keyboard** (2.1.1), with a visible focus ring (2.4.7): a plain ring, shown for keyboard focus only, never after a click or a drag.
- **Colour is never the only signal** (1.4.1): the modulation ring also differs from the value arc by its position, outside the dial.

## Sources

- Jakob Nielsen, *10 Usability Heuristics for User Interface Design*, Nielsen Norman Group (1994, updated 2020).
- Gestalt principles of grouping: proximity, similarity, common region, continuity (Wertheimer 1923; Palmer 1992 for common region).
- Paul Fitts, *The information capacity of the human motor system in controlling the amplitude of movement* (1954).
- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2* (2023).
- Apple, *Human Interface Guidelines*: Layout, minimum hit targets of 44 × 44 pt.
