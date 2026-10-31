# 115: An Easter egg

**What to build:** The owner's idea (inbox, 2026-10-30): "Add Easter egg with Claude dancing or singing."

**Blocked by:** none

**Status:** done (2026-10-30). Playing C, A, D, E by hand brings up a water drop trailing the Limpide logo from behind the Amp section; it stands on the Amp's top edge and moves with what is heard, and the same Notes send it back down. Its drawing and moves are with the owner to see before the release.

## Questions for the owner

1. **What sets it off?** Claude's recommendation: playing the notes hidden in the name, C, A, D, E, in that order, on any input (computer keyboard, piano, MIDI), within a few seconds. Nobody finds it by accident while playing scales, and it needs no new control.
2. **What happens?** Claude's recommendation: the synth sings a short phrase of its own on the Vowel Preset's talking filter, while a small character drawn in the app's style dances in the Oscillator Scope, its moves following the sound; then the Patch comes back as it was. About 8 seconds, stopped by any key.
3. **Which Claude?** Claude's logo and its pixel mascot belong to Anthropic, and the repository is public under MIT, so their use needs Anthropic's brand terms checked. Claude's recommendation: an original character, its name only ("Claude") in a caption, the same way About credits Claude Code. The owner may prefer to check the terms and use the real mascot.
4. **Hidden from the tips and the README?** Claude's recommendation: yes, mentioned only in the release notes of the version that brings it.

## Decisions (triage, 2026-10-30)

1. Playing C, A, D, E in that order brings the mascot; playing them again sends it away. Decided by the owner.
2. A mascot similar to Claude's, which lives on the edge of a section and reacts to the music. Decided by the owner. (Its look replaced by decision 8, its place by decision 10.) Claude noted that Anthropic's brand terms bear on a close likeness of its mascot in a public repository; the owner's call.
3. It makes no sound of its own: it stays in the synth and reacts to what is played. Decided by the owner (Claude's recommended sung phrase is not built).
4. Any input counts (computer keyboard, piano, MIDI, a player's Notes excepted), within a few seconds from first Note to last. Claude's call, open to the owner.
5. It perches on the top edge of the section of the last control turned, walking there when that changes; the Oscillators section at first. Claude's call, open to the owner. (Replaced by decision 10.)
6. It stays for the visit, not across a reload. Claude's call, open to the owner.
7. Hidden from the tips and the README, mentioned only in the release notes of the version that brings it. Claude's call, open to the owner.
8. Not Claude's mascot: a water drop in the same pixel style, its tail the Limpide logo. Decided by the owner, after seeing the first drawing (2026-10-30).
9. The tail on the drop's right, the logo reading left to right from it (green saw tooth at the drop, blue sine at the tip). Decided by the owner.
10. It comes up from behind the Amp section and always stands on the Amp's top edge (its purple line); it no longer follows the last control turned. Decided by the owner.
11. Its first size, 2 px a square (44 × 26 px): twice that was tried and dropped. Decided by the owner.
12. Along the Amp's top edge, it stands where it covers least of what is above: the free stretch of the header over the Amp at three and four across. On the phone and in 2 × 2 another section's Viewer ends 21 and 29 px above the Amp, so it reaches the bottom of that Viewer (its hop's room in 2 × 2; the Filter section's bottom corner on the phone). Claude's call, open to the owner.

## Agent Brief

**Category:** enhancement
**Summary:** Playing C, A, D, E calls a small mascot that perches on a section's edge and moves with the music until C, A, D, E sends it away.

**Desired behavior:**
- **Calling it:** the Notes C, A, D, E (any octave), played in that order by the player within a few seconds, from the computer keyboard, the on-screen piano or MIDI, bring the mascot in; the same again sends it away. The Demo, the Song and the Hold rhythm never call it.
- **The mascot:** a small drawing (about the size of a knob), similar to Claude's mascot, in the app's style and both themes. It perches on the top edge of the section of the last control turned, the Oscillators at first, and walks along the edges to a new section when that changes; it never covers a control or a value. (Since decisions 8 to 12: a water drop trailing the logo, coming up from behind the Amp and standing on its top edge.)
- **Reacting:** it moves with what is heard: a hop on each Note's start, a sway with the LFOs, its size or bounce with the Amp's level, still when nothing sounds. It reads the sound the Viewers already read; it adds nothing to the audio graph and no sound.
- **Reduced motion:** with reduced motion asked for, it sits still and only changes pose with each Note.
- **Out of the way:** it takes no focus, no Tab stop and no pointer events; a screen reader hears nothing of it. Not remembered across a reload.

**Acceptance criteria:**
- [x] Playing C, A, D, E brings it, and again sends it away; C, A, E, D does nothing; the Demo playing those Notes does nothing
- [x] It reaches the section of the last control turned, on the phone, 2 × 2, laptop and wide layouts, covering no control (the design audit run with it shown). Since decision 10: it stands on the Amp's top edge at all four, covering no control
- [x] With it shown, the Viewers' frame time stays within the draw-cost test's budget
- [x] No sound changes: an offline render with it shown matches one without
- [ ] The owner sees the drawing and its moves before the release

**Out of scope:**
- Any sound of its own
- A mention in the tips or the README

## How it was built

- **Calling it.** `createCallingPhrase` (`src/input/callingPhrase.ts`) hears each Note the player presses and completes on C, A, D, E in order, any octave, within 4 s from first to last; a Note out of order starts it over. The audio session now tells listeners of each press (`onPress`), which only the computer keyboard, the piano and MIDI make: the Demo, the Song and the Hold rhythm send their Notes to the engine directly, so they never call it. App brings it up on one completion and sends it down on the next; it is not remembered.
- **Its look** (`src/ui/Mascot.tsx`). A water drop on a 22 × 13 pixel grid, 2 px a square (44 × 26 px): light blue with a shine and dark eyes (a deeper blue in the light theme); its tail the logo's stroke in pixels, a saw tooth softening into a sine, in the logo's four colours from green at the drop to blue at the tip. Six poses: perched, hop and loud (with a splash of droplets), looking left and right, dozing.
- **Where it stands.** On the Amp section's top edge, in a box whose bottom is that edge and which hides what goes below it, so it comes up from behind the Amp over 0.4 s and sinks back the same way (with reduced motion it is there and gone at once). Along the edge it takes the spot whose box covers least of the controls and Viewers above, the leftmost of equals, found again whenever the Amp moves or changes size.
- **Its moves** (`src/ui/mascotMotion.ts`, a pure function of what it hears each frame): a hop of 6 px over 0.18 s from each Note's start, a lean of up to 7° about the drop's foot with the LFOs that have some Depth (looking the way it leans), a stretch of up to 10 % with the Amp's level, a splash when loud; still when nothing sounds, its eyes shut after 2 s. With reduced motion it never moves and changes pose only on each Note. It reads the Modulation model, which now also gives when the newest Note started (`struck`).
- **Out of the way.** `aria-hidden`, no pointer events, no Tab stop, under the header and the cards. A glossary entry, Mascot; nothing in the tips or the README.
- **Tests.** Unit: the phrase (6), the moves (6). Engine: `struck` for a Note, a Note handed over and a dip; and an offline render reading the model every frame matches one that does not, within the renders' own rounding (two identical renders already differ by 2e-7). Playwright (`e2e/mascot.spec.ts`, both browsers): calling and sending away, C, A, E, D, the piano in other octaves, the Demo not calling it; it rises from behind the Amp and sinks back, at once with reduced motion; at 375, 690, 1440 and 1920 px it stands on the Amp's top edge within its width, covering no control, and at 1440 and 1920 nothing at all; and the page's frame work with it shown is within 0.5 ms of without (about 4.5 ms either way; no draw-cost test existed in the browser, so this one is new). The design audit itself was not changed: the mascot is hidden from it as from a screen reader, so the overlap check stands in for it.
- **Before.** The first build (2344524) drew a creature after Claude's mascot, perched by the name of the section of the last control turned and walking between sections; decisions 8 to 11 replaced it the same day.
