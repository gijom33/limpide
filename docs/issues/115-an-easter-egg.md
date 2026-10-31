# 115: An Easter egg

**What to build:** The owner's idea (inbox, 2026-10-30): "Add Easter egg with Claude dancing or singing."

**Blocked by:** none

**Status:** done (2026-10-30). Playing C, A, D, E by hand calls a small pixel creature after Claude's, which perches right of the name of the section of the last control turned and moves with what is heard; the same Notes send it away. Its drawing and moves are with the owner to see before the release.

## Questions for the owner

1. **What sets it off?** Claude's recommendation: playing the notes hidden in the name, C, A, D, E, in that order, on any input (computer keyboard, piano, MIDI), within a few seconds. Nobody finds it by accident while playing scales, and it needs no new control.
2. **What happens?** Claude's recommendation: the synth sings a short phrase of its own on the Vowel Preset's talking filter, while a small character drawn in the app's style dances in the Oscillator Scope, its moves following the sound; then the Patch comes back as it was. About 8 seconds, stopped by any key.
3. **Which Claude?** Claude's logo and its pixel mascot belong to Anthropic, and the repository is public under MIT, so their use needs Anthropic's brand terms checked. Claude's recommendation: an original character, its name only ("Claude") in a caption, the same way About credits Claude Code. The owner may prefer to check the terms and use the real mascot.
4. **Hidden from the tips and the README?** Claude's recommendation: yes, mentioned only in the release notes of the version that brings it.

## Decisions (triage, 2026-10-30)

1. Playing C, A, D, E in that order brings the mascot; playing them again sends it away. Decided by the owner.
2. A mascot similar to Claude's, which lives on the edge of a section and reacts to the music. Decided by the owner. Claude noted that Anthropic's brand terms bear on a close likeness of its mascot in a public repository; the owner's call.
3. It makes no sound of its own: it stays in the synth and reacts to what is played. Decided by the owner (Claude's recommended sung phrase is not built).
4. Any input counts (computer keyboard, piano, MIDI, a player's Notes excepted), within a few seconds from first Note to last. Claude's call, open to the owner.
5. It perches on the top edge of the section of the last control turned, walking there when that changes; the Oscillators section at first. Claude's call, open to the owner.
6. It stays for the visit, not across a reload. Claude's call, open to the owner.
7. Hidden from the tips and the README, mentioned only in the release notes of the version that brings it. Claude's call, open to the owner.

## Agent Brief

**Category:** enhancement
**Summary:** Playing C, A, D, E calls a small mascot that perches on a section's edge and moves with the music until C, A, D, E sends it away.

**Desired behavior:**
- **Calling it:** the Notes C, A, D, E (any octave), played in that order by the player within a few seconds, from the computer keyboard, the on-screen piano or MIDI, bring the mascot in; the same again sends it away. The Demo, the Song and the Hold rhythm never call it.
- **The mascot:** a small drawing (about the size of a knob), similar to Claude's mascot, in the app's style and both themes. It perches on the top edge of the section of the last control turned, the Oscillators at first, and walks along the edges to a new section when that changes; it never covers a control or a value.
- **Reacting:** it moves with what is heard: a hop on each Note's start, a sway with the LFOs, its size or bounce with the Amp's level, still when nothing sounds. It reads the sound the Viewers already read; it adds nothing to the audio graph and no sound.
- **Reduced motion:** with reduced motion asked for, it sits still and only changes pose with each Note.
- **Out of the way:** it takes no focus, no Tab stop and no pointer events; a screen reader hears nothing of it. Not remembered across a reload.

**Acceptance criteria:**
- [x] Playing C, A, D, E brings it, and again sends it away; C, A, E, D does nothing; the Demo playing those Notes does nothing
- [x] It reaches the section of the last control turned, on the phone, 2 × 2, laptop and wide layouts, covering no control (the design audit run with it shown)
- [x] With it shown, the Viewers' frame time stays within the draw-cost test's budget
- [x] No sound changes: an offline render with it shown matches one without
- [ ] The owner sees the drawing and its moves before the release

**Out of scope:**
- Any sound of its own
- A mention in the tips or the README

## How it was built

- **Calling it.** `createCallingPhrase` (`src/input/callingPhrase.ts`) hears each Note the player presses and completes on C, A, D, E in order, any octave, within 4 s from first to last; a Note out of order starts it over. The audio session now tells listeners of each press (`onPress`), which only the computer keyboard, the piano and MIDI make: the Demo, the Song and the Hold rhythm send their Notes to the engine directly, so they never call it. App toggles the mascot on each completion; it is not remembered.
- **Where it perches.** Right of its section's name, its feet on the name's baseline (`src/ui/Mascot.tsx`): the space on the heading line is free at every layout, where an edge between sections would cover the Viewers above (Claude's call, open to the owner). The section is the one of the last Patch field changed by hand or by a Controller (`sectionOfField` in `src/ui/sections.ts`), the Oscillators at first. To a new section it walks in a straight line at 320 px/s, legs in turn; with reduced motion it goes straight there.
- **Its moves** (`src/ui/mascotMotion.ts`, a pure function of what it hears each frame): a hop of 6 px over 0.18 s on each Note's start, a lean of up to 7° with the LFOs that have some Depth (looking the way it leans), a stretch of up to 10 % with the Amp's level, arms up when loud; still when nothing sounds, its eyes shut after 2 s. With reduced motion it never moves and changes pose only on each Note. It reads the Modulation model, which now also gives when the newest Note started (`struck`).
- **Its look.** A 16 × 12 pixel drawing at 2 px a square (32 × 24 px), terracotta with dark eyes, a little darker in the light theme; eight poses (perched, hop, loud, looking left and right, two walking steps, dozing). `aria-hidden`, no pointer events, no Tab stop, under the header and the cards. A glossary entry, Mascot; nothing in the tips or the README.
- **Tests.** Unit: the phrase (6), the moves (7), each Patch field's section (2). Engine: `struck` for a Note, a Note handed over and a dip; and an offline render reading the model every frame matches one that does not, within the renders' own rounding (two identical renders already differ by 2e-7). Playwright (`e2e/mascot.spec.ts`, both browsers): calling and sending away, C, A, E, D, the piano in other octaves, the Demo not calling it; at 375, 690, 1440 and 1920 px it stands where it should on each of the four sections and overlaps no control, value or Viewer; it walks rather than jumps; and the page's frame work with it shown is within 0.5 ms of without (about 4.5 ms either way; no draw-cost test existed in the browser, so this one is new). The design audit itself was not changed: the mascot is hidden from it as from a screen reader, so the overlap check above stands in for it.

