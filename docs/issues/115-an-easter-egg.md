# 115: An Easter egg

**What to build:** The owner's idea (inbox, 2026-10-30): "Add Easter egg with Claude dancing or singing."

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The owner answered (decisions below); the owner sees the mascot's drawing before it ships.

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
- [ ] Playing C, A, D, E brings it, and again sends it away; C, A, E, D does nothing; the Demo playing those Notes does nothing
- [ ] It reaches the section of the last control turned, on the phone, 2 × 2, laptop and wide layouts, covering no control (the design audit run with it shown)
- [ ] With it shown, the Viewers' frame time stays within the draw-cost test's budget
- [ ] No sound changes: an offline render with it shown matches one without
- [ ] The owner sees the drawing and its moves before the release

**Out of scope:**
- Any sound of its own
- A mention in the tips or the README
