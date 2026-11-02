# Persona review 6: accessibility

Headless Chromium (Playwright 1.64), keyboard only, mainly at 1440 × 900, with 393 × 852 (phone), 780 × 900 (2 × 2), 900 × 700 and 720 × 450 at twice the pixel density (a 1440 × 900 window at 200 % zoom); reduced motion on and off; the Dark and Light themes. About 15 minutes of keyboard time, plus a Tutorial and the Tour taken to their ends; 2 Nov 2026; version 1.21.1 (build 3015b1a), on the live site.

Two people again: **Kai** uses only the keyboard; **Rosa** uses a screen reader. Every action was a key press (Tab, Shift+Tab, the arrows, Home, End, Page Up and Down, Enter, Space, Escape, the note letters). Rosa's view is the accessibility tree (`ariaSnapshot()` and Chromium's computed names and descriptions) plus each control's role, value and state. No real VoiceOver or NVDA was run, so what a screen reader *says* is read from the tree, not heard. axe-core 4.10.2 ran in both themes. MIDI was both refused (the panel's denied state) and allowed with no device (the Aftertouch list).

## First impression

**Kai:** "The welcome opens on Play the Demo now, not on a build link. Escape, and I'm on Demo. Tab walks the header as I see it: Hold, the BPM, Tap, then the button columns, top before bottom. The arrows on the Cutoff move a semitone, and the value lands on round numbers."

**Rosa:** "Same clean page: one heading, four regions, a slider that says 'Cutoff, 2.00 kHz' with its tip as a description. Greyed-out knobs now say why: 'No effect while the Filter Envelope Amount and Osc 2's Env Amount are 0.' With the Synth Geek Layer on, the tips add 'Under the hood' and a History line, and I can read the readouts, like 'Resonance Q 1.32'."

## What they tried, in order, and what happened

1. **Welcome.** Focus opens on "Play the Demo". Tab cycles inside it (Bead's button, the links, the three actions). Escape puts focus on Demo. Fixed since 1.16.0.
2. **Header Tab order.**
   - **1440:** Wordmark, ‹, Patch, ›, Octave up, Octave down, Hold, Tempo, Tap, Demo, Song, Tutorial, About, MIDI, Display: the columns of issue 154, top before bottom.
   - **Phone and 2 × 2:** Demo, Tutorial, Song, Hold, Tempo, MIDI, Display, About on one row, then the octave buttons. Row by row, it matches. Fixed since 1.16.0.
3. **A sound, made and shaped.**
   - A plays C4.
   - Cutoff: Up goes 2.00 → 2.12 → 2.24 kHz (a semitone), Shift+Up 2.26 kHz, Page Up 4.00 kHz, Home 20 Hz, End 20.00 kHz.
   - Resonance: 1 % a press. Filter Attack: "the next round time".
   - Each tip ends with its own step ("↑↓ a semitone · Shift 10 cents · Page an octave"), so Rosa hears what a press does.
4. **LFO 1 Sync.** Space turns it on. The Rate reads "1/4, 2 Hz", and Up makes it "1/8 D, 2.67 Hz". The plot's name follows: "LFO 1: Sine, 1/8 D · 2.67 Hz, Depth 10 %, on Cutoff".
5. **The tempo.**
   - The BPM is a spinbutton: "Tempo, 120 BPM". Up 121, Shift+Up +10, Page Up +10, Home 40, End 240.
   - Enter opens a field ("Tempo in BPM"). Typing 96 and Enter sets it, but **focus falls to the page body**.
   - The tip says "double-click to type it" and never mentions Enter.
   - Four Enters on Tap set 131 BPM, but nothing is announced. Rosa, on Tap, does not learn the new tempo.
   - At 393 and 780 px the tempo is a button that shows "120 BPM", but its accessible name is just "Tempo". Its panel (BPM and Tap) opens with Enter and closes with Escape back to the button, but it stays open when Tab leaves it.
6. **The MIDI panel and aftertouch.**
   - **MIDI refused:** the panel says why. MIDI Learn and Quick Setup are disabled, so Tab skips them, which is right.
   - **MIDI allowed:** Tab goes MIDI Learn, Quick Setup, the bend range (one stop), then the Aftertouch list. It is a native select, "Aftertouch, Cutoff", grouped by stage. Typing "Res" picks Resonance, and it is stored.
   - **But Escape from any control inside the panel** (MIDI Learn, Quick Setup, the bend range, Aftertouch) **closes it and drops focus to the page body.** Escape with focus on the MIDI button returns there, as before.
   - Tab past the list leaves the panel open over Display, Voices, Legato and Glide, so those stops are hidden.
7. **Patch panel and the about line.** Enter on Patch opens Search. Typing "acid" and Enter loads Acid, and focus returns to the Patch button. The status reads the Preset's name and its about line.
   - The about line's "×" ("Close the Preset's description") is the next Tab stop after ›. Escape anywhere takes the line away, and focus stays put.
   - The ‹ › arrows show no line, as decided in issue 153.
8. **A Tutorial to its end (Bass, 15 Steps), without "Do it for me".**
   - Picking it focuses Start. Each Step's text is a polite live region and names the control and its target in words ("raise it to half").
   - Next waiting is `aria-disabled` and keeps the focus, and the Step's control is brought into view.
   - Every Step was made by keyboard: the control is 26 to 49 Shift+Tabs back from Next, then the arrows, then as many Tabs forward.
   - That is 62 to 159 key presses a Step, **1,353 for the Tutorial**, about the 100 a Step of 1.16.0.
   - Done leaves the card with **focus on the page body**. So does "Quit the tutorial". Escape on the card does nothing.
   - At 1440 × 900 no Tab stop is hidden under the card. Fixed since 1.16.0.
9. **The Tour (from the welcome and from About).** Next keeps the focus through the four cards, each read out. The last card offers "Build a Bass", and Done is one Tab on. **Done, and the card's "Close the Tour", drop focus to the page body.** Escape does nothing on the card.
10. **About and Bead's card.**
    - About opens on "Play the Demo". Bead's button ("Bead, Limpide's water drop: its tricks") is reached by Shift+Tab.
    - Enter opens the "Bead" region in place of the credits, with `aria-expanded` true. Its list of turns is a real list, with Back and a link.
    - Escape returns to Bead's button, and a second Escape closes About and returns to the About button.
    - Bead's pictures are `aria-hidden`. Bead pointing in a Tutorial is decorative, and the Step's words carry the meaning.
11. **The Demo's parts.**
    - The parts are one Tab stop, 52 Tabs from Demo. → → moves to "Play from part 3, Poly Pluck", and Enter or Space plays it.
    - Focus stays, and the caption is read out. Fixed since 1.16.0.
    - Escape on a part stops the Demo ("The Demo stopped: you are playing now.") and **drops focus to the body**.
12. **Display and the Synth Geek Layer.**
    - Display's panel is one stop per radio group, and Escape returns focus to Display.
    - Turning on Geek adds named notes ("Oscillator formula", "Filter formula") and readouts as text ("Resonance Q 1.32", "Sustain −3.1 dB", "Rate 0.50 s"). They are not tied to their controls, so on the Resonance knob Rosa hears 20 %, not its Q.
    - The panel still stays open when Tab leaves it. It covers the Osc 1 tab, and a later Escape pulls focus back to Display.
13. **Greyed-out controls.** Each describes why first: "No effect unless Osc 1's Waveform is Pulse", "No effect while LFO 1's Depth is 0". Fixed since 1.16.0.
14. **Focus hidden under the sticky header.** Walking the page backwards with Shift+Tab, `elementFromPoint` checked at every stop:
    - **Phone (393 × 852):** 12 of 56 stops are covered by the header, which slides back in as the page scrolls up. They are all of the Amp, the Filter Envelope, Osc 1's Octave and FM.
    - **200 % zoom (720 × 450 CSS px):** 9 of 52 stops are covered: Cutoff, Resonance, Velocity, Key Track, Filter Mode, Slope, Pulse Width, the Waveform and the Osc 1 tab. The header there takes 165 of 450 px. With the Tutorial card open it is 14.
    - Tab forward hides none. At 1440 × 900 nothing is hidden either way.
15. **Reduced motion.** No CSS animation runs, and the page did not scroll by itself. The code keeps Bead still, or looking only, with reduced motion.
16. **axe-core.**
    - **Dark:** `color-contrast` ×7 (the greyed values, 2.14:1) and `region` ×1 (the tooltip).
    - **Light** (Display → Theme → Light, by keyboard):
      - `color-contrast` ×18: the header's words (Hold, BPM, Tap, Demo, Song, Tutorial, About, MIDI, Display) and the unselected "24" at 4.36:1 (#646b7a on #e6e8ed).
      - The OSCILLATORS heading at 3.43:1 (#06915f on #e9eef0).
      - The greyed values at 1.79:1.
    - The focus ring is clear in both themes.

## What worked

- Everything issue 104 set out holds on the live site:
  - The Demo's parts play from the keyboard.
  - The header's Tab order follows the screen at every width.
  - The Tutorial card takes and keeps the focus and never hides a stop at 1440 × 900.
  - Greyed-out controls say why.
- The welcome opens on its first action.
- Arrow steps in each control's own unit (issue 160): round values, and the tip says the step.
- About, Bead's card and the Patch panel: Escape steps back one level at a time, and focus returns to the button that opened it.
- The about line closes by keyboard and is announced once.
- The Synth Geek Layer's formulas, readouts and History lines reach a screen reader.
- A synced Rate reads its note value and its Hz.
- No sideways scroll at 200 % zoom.
- **Success criterion met:**
  - Kai made a sound, shaped it, finished the Bass Tutorial without help, took the Tour, set the tempo and the aftertouch Destination, and opened About and Bead's card without the mouse.
  - Rosa could follow by name, value and description.

## Where they got stuck

- **Kai (closing things):** "Done on the Tutorial, Close on the Tour, Escape in the MIDI panel or on the Demo's parts, Enter after typing a BPM: each time my focus vanishes and the next Tab starts from the top of the page."
- **Kai (phone, and 200 % zoom):** "Going back up with Shift+Tab, the header slides in over the knob I'm on. At 200 % I lose the Cutoff, the Resonance and the Filter Mode under it."
- **Kai (Tutorial):** "Every Step is 30 to 50 Shift+Tabs to the knob and the same back to Next. 1,353 keys for one Tutorial."
- **Rosa:** "Tap changes the tempo and says nothing. On a phone the tempo button is just 'Tempo'; the 120 BPM written on it is never read."
- **Rosa (light theme, low vision):** "The grey header words are just under what I can read comfortably, and the green Oscillators heading is faint."

## Would they

- **Like it?** Kai: yes, every 1.16.0 complaint he raised is fixed. Rosa: yes, the Geek layer and History are a treat to read.
- **Share it?** Kai: yes, even the Demo and the Tutorials now. Rosa: yes, with "the pictures are still only named" as a warning.
- **Come back?** Kai: yes, to play. Rosa: yes, for the Tutorials, whose Steps are read out.
- **Recommend?** Kai: yes, to keyboard users on a laptop. On a phone keyboard or zoomed in, not until Shift+Tab stops hiding under the header. Rosa: to blind learners for the controls and the words, not yet for the Viewers.

## Since 1.16.0

- **Fixed:**
  - The Demo's parts by keyboard.
  - The header's Tab order at 860 px and below.
  - The Tutorial card hiding stops at 1440 × 900.
  - The focus after picking a Tutorial and after each Next.
  - Greyed-out controls explained.
  - The welcome's focus on the build link.
  - Escape anywhere no longer pulls focus to the MIDI button.
- **New since then and not right:**
  - Focus falls to the page body when the MIDI panel, the Tour, a Tutorial or the BPM field closes.
  - Shift+Tab hides focus under the header on a phone and at 200 % zoom.
  - The light theme's header words and Oscillators heading are under 4.5:1.
  - The tempo is not announced after Tap and missing from the phone button's name.
- **Unchanged:**
  - The Tutorial's cost in keys a Step.
  - Display's panel left open after Tab, and Escape then pulling focus to Display.
  - The Scopes and Spectrums named but not described.
  - The greyed values at 2.14:1 (1.79:1 in the light theme).

## Findings, ranked

1. Focus falls to the page body when something closes. It happens on Escape from any control inside the MIDI panel (MIDI Learn, Quick Setup, the bend range, Aftertouch), on Done or "Quit the tutorial" on a Tutorial card, on Done or "Close the Tour" on the Tour, on Escape on the Demo's parts (which also stops the Demo), and on Enter after typing a BPM. To reproduce: MIDI allowed, Tab to MIDI, Enter, Tab to MIDI Learn, Escape, and `document.activeElement` is the body. Focus should return to the button that opened each one: MIDI, Tutorial, the BPM (WCAG 2.4.3).
2. Shift+Tab hides the focused control under the sticky header on a phone and at 200 % zoom. At 393 × 852, 12 of 56 stops are covered (all of the Amp, the Filter Envelope, Osc 1's Octave and FM). At a 1440 × 900 window zoomed to 200 %, 9 of 52 are covered (Cutoff, Resonance, Filter Mode, Slope, the Osc 1 tab…), 14 with the Tutorial card open. To reproduce: Tab to LFO 2's Sync, then Shift+Tab upward; the header slides back in over the control. Tab forward is fine. A `scroll-padding-top` the header's height would likely fix it (WCAG 2.4.11).
3. The light theme's text falls under 4.5:1. The header's words (Hold, BPM, Tap, Demo, Song, Tutorial, About, MIDI, Display) and the unselected Slope "24" are at 4.36:1 (#646b7a on #e6e8ed). The OSCILLATORS heading is at 3.43:1 (#06915f on #e9eef0). The greyed values are at 1.79:1, against 2.14:1 in the dark theme. To reproduce: Display → Theme → Light, then axe at 1440 × 900 (WCAG 1.4.3).
4. A Tutorial costs about 90 key presses a Step by keyboard. In Bass (15 Steps), each Step's control is 26 to 49 Shift+Tabs back from Next and as many Tabs forward: 1,353 keys for the Tutorial. Nothing on the card jumps to the Step's control or back. A "Go to the control" button, or a key that toggles between the card and the control, would cut it to a handful (WCAG 2.4.1, usability).
5. The tempo is not spoken. Tap changes the BPM with no announcement. At 393 and 780 px the tempo button shows "120 BPM" but is named only "Tempo" (WCAG 2.5.3 Label in Name, 4.1.3). The BPM's tip says "double-click to type it" but not that Enter does it from the keyboard. To reproduce: Tab to Tap, press Enter four times, and no live region changes. At 393 px, read the Tempo button's name.

Also worth an inbox line:
- Display's panel and the tempo panel stay open when Tab leaves them, and so does the MIDI panel, which then covers Display, Voices, Legato and Glide. The Tutorial list stays open over About. After Display's panel is left open, a later Escape still pulls focus back to Display.
- The Synth Geek Layer's readouts ("Resonance Q 1.32", "Sustain −3.1 dB") are loose text, not part of their control's description, so they are not heard on the knob.
- Escape does nothing on the Tour and Tutorial cards, unlike every other panel.
- The Demo's parts are 52 Tabs from the Demo button.
- The Scopes and Spectrums are named but not described (WCAG 1.1.1). The Geek readouts give their period and frequency, but only with the layer on.
