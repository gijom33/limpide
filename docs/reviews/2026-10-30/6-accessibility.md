# Persona review 6: accessibility

Headless Chromium (Playwright), keyboard only, mainly at 1440 × 900, with the header's Tab order also recorded at 393 × 852 (phone), 780 × 900 (2 × 2), 900 × 700 and 1920 × 1080; about 15 minutes of keyboard time; 30 Oct 2026; version 1.16.0 (build 328a370), on the live site.

Two people again: **Kai** uses only the keyboard; **Rosa** uses a screen reader. Every action was a key press (Tab, Shift+Tab, arrows, Home, End, Page Up, Enter, Space, Escape, the note letters). Rosa's view is the accessibility tree (`ariaSnapshot()`) plus each control's role, name, value and description. No real VoiceOver or NVDA was run, so what a screen reader *says* is read from the tree, not heard. axe-core 4.10.2 ran at 1440 × 900 and 393 × 852.

## First impression

**Kai:** "The welcome opens and my focus is on a link called '328a370'. What is that? Escape, and I'm on Demo, which makes sense. The page is much shorter to Tab through than last time: 39 stops after the header instead of 60. A waveform picker is one stop now, and the arrows move through it."

**Rosa:** "Same clean structure: one heading, four regions, sliders that say 'Filter Attack, 5.00 ms'. The pictures now have names ('Oscillator Scope', 'Envelope Timeline'), and each LFO's picture says what it does: 'LFO 1: Sine, 2.00 Hz, Depth 20 %, on FM'. Still nothing about what the Scopes and Spectrums actually show."

## What they tried, in order, and what happened

1. **Welcome.** Focus opens on the build link "328a370", the first link in the dialog. In 1.8.1 it opened on "Play the Demo". Escape, Play the Demo and Follow the Tutorial all close it and put focus on the Demo button, so Tab carries on from the header. That part is fixed.
2. **Header Tab order, every layout** (the code reviewer's suspicion). At every width the order is: Wordmark, Previous Preset, Patch, Next Preset, Octave up, Octave down, Hold, MIDI, Display, About, Demo, Tutorial, Song.
   - **1920 × 1080:** one row, read left to right in that order. It matches.
   - **861 to 1919 px** (checked at 900 and 1440): the octave buttons sit in the centre, and the right-hand block has Hold, MIDI, Display and About on top with Demo, Tutorial and Song under them. Read row by row, that also matches.
   - **Phone (393 × 852): confirmed, it does not match.** Row 1 is the Wordmark and Patch. Row 2 is Demo, Tutorial and Song on the left, then Hold, MIDI, Display and About on the right. Row 3 is the octave buttons and the piano. Focus goes from Next Preset down to Octave up and Octave down on row 3, back up to Hold…About on the right of row 2, and then left to Demo, Tutorial and Song.
   - **2 × 2 (780 × 900): the same jump.** Row 1 runs Wordmark, Patch, Demo, Tutorial, Song, Hold…About, and the octave buttons are on row 2. Tab goes to row 2 first, then to Hold…About on the right, and only then back to Demo.
   - Rosa hears Hold, MIDI, Display and About before the "Play" group (Demo, Tutorial, Song) at every width, which is not the "one order" issue 44 set out (identity, playing, piano, set-up).
   - With the 2 × 2 or phone header slid away after scrolling, Shift+Tab back into it brings it back, so focus is never hidden up there.
3. **Notes.** A, then holding F, played: F4 shows as pressed on the piano. Typing in the Patch search does not play notes.
4. **Space.** Space on Hold now toggles it (pressed true, then false). Space on an LFO destination opens the menu. Fixed since 1.8.1.
5. **Oscillators tabs.** The tablist "Oscillator" holds Osc 1, Osc 2, Sub & Noise and Mixer. The arrows and Home move through it, and one Tab stop covers it. A tab's name says "(sounding)" when that source is heard: "Osc 1 (sounding)", and "Osc 2 (sounding)" once its Mixer fader is up. On the Mixer, End took the Osc 2 fader to 100 %. Its description says that at 0 "its tab and Tuning knobs" grey out.
6. **Greyed-out controls.** Pulse Width on a Saw, Osc 2's Pulse Width, Octave and Semitone while Osc 2 is silent, the Filter Envelope's Attack…Release at Amount 0, and each LFO's Rate at Depth 0 are drawn at 30 %. Rosa hears them exactly like active controls ("Filter Attack, slider, 5.00 ms"). There is no `aria-disabled`, nothing in the description, and no state. axe flags their value text at 2.14:1. The design principles treat them as inactive and so exempt, but they still respond to the arrow keys.
7. **Cutoff.** Page Up 2.00 → 3.99 kHz, Home 20 Hz, End 20.00 kHz, Down steps it. Fixed since 1.8.1.
8. **LFO 1 to FM (the new eighth target).** Space opens the menu "LFO 1 Destination". It has three groups (Oscillators, Filter, Amp), and FM is fifth under Oscillators. Arrow Down to FM, then Enter. Focus returns to "LFO 1 Destination: FM". Depth Up ×10 makes it 20 %, and the plot's name updates to "…Depth 20 %, on FM".
9. **Display.** Enter opens it, and Tab goes into the "Viewer controls" region: View, Axes, Show, Keys, Tips, Theme, each radio group one stop. Tips → Off with an arrow. With tips off, focusing a knob shows no tooltip, and its description stays for Rosa. Escape closes the panel and returns focus to Display. One oddity: the panel stays open when Tabbing past its end, and Escape pressed on an Amp fader far below still closed it and pulled focus up to Display.
10. **Patch panel.** Enter opens it with focus in Search. Enter on "Init" loads it, closes the panel and returns focus to the Patch button. Escape from inside does the same. Next Preset with Enter announces "Pure Sine" and then "Soft Triangle" through the hidden status. Import file is now a real button in the Tab order. All fixed since 1.8.1.
11. **MIDI and About.** Both close with Escape and return focus to their buttons. About, like the welcome, opens on the "328a370" link.
12. **The Demo (new bar of segments).** Enter on Demo starts it (pressed true). The card's caption is a polite live region, so each part is read out. The card sits at the end of the page, 43 Tabs from the top, after LFO 2's Retrigger. Its group "Part 3 of 15" holds 15 buttons, "Play from part 1, Kick" … "Play from part 15, Brass Section", and the current one has `aria-current="step"`. The focus ring on a segment is clear. **But Enter or Space on "Play from part 5, Tremolo Keys" stops the Demo.** The status says "The Demo stopped: you are playing now.", the segments disappear, and focus falls to the page body. An arrow key on a segment, or on the Demo button itself, does the same. The stop rule (`demoStop`) lets Tab, Shift and modifier keys through, and lets Enter through only on the sound's controls. Every other key on the Demo card counts as the person taking over. The segments can only be used with a pointer.
13. **A Tutorial (Bass).**
    - Enter on Tutorial opens a group of four buttons ("Tutorial: Bass", "…, finished" once done), reached with Tab. Enter on Bass loads it and **drops focus to the body**. The card is 43 Tabs away at the end of the page, and its text is a polite live region, so Rosa hears it.
    - Start; step 1 is "Raise Osc 2 in the Mixer to half". The step names the control in words, and the ring and "→ 50 %" are visual only. The fader is 58 Shift+Tabs back. Up ×22 brings it from 44 % and it snaps to 50 %. Next enables, and the new sentence is read out.
    - Next is 41 Tabs forward. Pressing it moves on, and the Next button, disabled for the new step, **drops focus to the body**.
    - About 100 key presses per step. "Do it for me" is a shortcut.
    - From the welcome, Follow the Tutorial opens the card, but focus goes to Demo.
14. **Focus hidden behind the docked cards** (each Tab stop checked with `elementFromPoint`).
    - At 1440 × 900 with the Tutorial card open, **13 of 71 stops are fully covered by it**: the LFO 1 destination and Next destination, then all of LFO 2 (waveform, the destination arrows, Depth, Rate, Retrigger). The page does not scroll at that size, so nothing brings them out from under the card.
    - With the Demo card, LFO 2's Depth and Rate are only clipped at a corner.
    - On a phone the Demo card hides controls at the bottom of the screen too. The Demo also scrolls the page itself, so I counted no exact number there.
15. **axe-core.** 1440: `color-contrast` ×7 (the greyed values, 2.14:1) and `region` ×1 (the tooltip outside the landmarks). 393: `region` ×1.

## What worked

- Most of what review 6 asked for in 1.8.1 is done:
  - Space presses buttons.
  - Focus comes back after a Preset loads, after Escape and after the welcome.
  - Radio groups are one stop each and work with the arrows.
  - Home, End and Page Up work on knobs and faders.
  - The Preset is announced.
  - Slider names are distinct ("Amp Attack", "LFO 2 Rate").
  - Import file is a button.
  - The letter keys can be switched off.
  - The Viewers are named images.
  - The LFO plots are described in words.
- The page went from 72 Tab stops to 52, the header included.
- The new LFO target FM works fully by keyboard, and the plot's text follows it.
- Tooltips can be turned off without losing the descriptions.
- The Demo card's caption and the Tutorial's steps are live regions, so Rosa hears each new part or step.
- **Success criterion met:**
  - Kai played notes, raised Osc 2, routed LFO 1 to FM, loaded Presets and finished a Tutorial step without the mouse.
  - Rosa could follow along by name and value.

## Where they got stuck

- **Kai (Demo):** "I Tabbed 43 times to reach the parts, pressed Enter on Tremolo Keys, and the Demo stopped dead. My focus vanished, and the parts went with it."
- **Kai (Tutorial):** "Each step: about 60 Shift+Tabs to the control, then 40 Tabs back to Next. After Next I'm on nothing. And at this window size, when I Tab to LFO 2 I can't see my focus at all: the card is on top of it."
- **Kai (phone keyboard, 2 × 2 tablet):** "Logo, Patch, then the + and − below the buttons, then the right half of the buttons, then the left half. I can't predict it."
- **Rosa:** "Knobs that 'do nothing right now' sound exactly like the ones that do. A sighted learner sees them fade, and I'm told nothing."
- **Rosa:** "Opening the welcome or About, the first thing I hear is 'link, 328a370'."
- **Rosa:** "The Scopes and Spectrums still give only their names. That's better than nothing, but they're still not described."

## Would they

- **Like it?** Kai: yes. Almost every 1.8.1 complaint is fixed. Rosa: yes. The controls and LFO plots read well.
- **Share it?** Kai: yes, but not the Demo or the Tutorials, which fight the keyboard. Rosa: with reservations, until the greyed-out state and the Viewers say something.
- **Come back?** Kai: yes, to play and to try Presets. Rosa: yes, for the Tutorials, since their text is read out, if focus stopped falling to the body.
- **Recommend?** Kai: yes, to keyboard users on a laptop, with "skip the Demo's parts" as a warning. Rosa: not yet to blind learners: the "what you see" half is still mostly silent.

## Since 1.8.1

- **Fixed:**
  - Space on buttons and radios.
  - Focus return after a panel closes, a Preset loads or the welcome closes.
  - Import file reachable.
  - Arrow keys inside radio groups.
  - Home, End and Page Up/Down.
  - The Preset announced.
  - Distinct slider names.
  - Letter keys can be turned off.
  - Viewers exposed as named images.
  - LFO plots described.
  - Octave up now comes before Octave down, matching the stack.
- **New since then and not right:**
  - The Demo segments stop the Demo by keyboard.
  - The header's Tab order at 860 px and below.
  - The Tutorial card covers focused controls at 1440 × 900.
  - Greyed-out controls are not exposed.
  - Focus falls to the body after picking a Tutorial and after each Next.
- **Regressed:** the welcome now opens on the build link rather than "Play the Demo".
- **Unchanged:** the Scopes and Spectrums have names but no description of what they show. The dimmed values are 2.14:1.

## Three findings, ranked

1. Enter or Space on a Demo segment ("Play from part 5, Tremolo Keys"), or any arrow key on the Demo card, stops the Demo ("you are playing now") instead of jumping, and focus falls to the page body. The segments only work with a pointer (WCAG 2.1.1 Keyboard, 2.4.3 Focus Order).
2. At 860 px and below (phone and 2 × 2) the header's Tab order is not the visual order. After Next Preset, focus goes down to Octave up and down on the piano row, back up to Hold, MIDI, Display and About on the right, then left to Demo, Tutorial and Song. At 861 px and up it matches (WCAG 2.4.3 Focus Order; issue 44's one order).
3. At 1440 × 900 the docked Tutorial card fully hides 13 of 71 Tab stops (LFO 1's destination, all of LFO 2), and the page cannot scroll them clear (WCAG 2.4.11 Focus Not Obscured (Minimum)). Picking a Tutorial and each Next also drop focus to the body (2.4.3).

Also worth an inbox line:
- Greyed-out controls (Pulse Width on a Saw, a silent Osc 2's tuning, the Filter Envelope at Amount 0, an LFO's Rate at Depth 0) are not exposed to screen readers: no `aria-disabled`, state or description (WCAG 1.3.1). Their 2.14:1 values rely on an "inactive" exemption that WCAG gives to disabled controls, which these are not.
- The welcome and About open with focus on the build link "328a370" rather than their first action.
- The Display panel stays open when Tab leaves it, and Escape anywhere on the page then pulls focus back to Display.
- Rosa hears Hold, MIDI, Display and About before the Play group at every width.
- The Scopes and Spectrums are named but not described (WCAG 1.1.1).
