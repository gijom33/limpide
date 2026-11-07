# Persona review 6: accessibility

Ran on version 1.26.1 (build 38df0ad), on the live site, on 2026-11-07.

Headless Chromium and WebKit (Playwright 1.64), keyboard only, at 1440 × 900, with 393 × 852 (phone) and 720 × 450 (a 1440 × 900 window at 200 % zoom) for the hidden-focus check. About 15 minutes of keyboard time, plus the Tour to its end and the first Steps of the Bass Tutorial.

Two people, as before: **Kai** uses only the keyboard; **Rosa** uses a screen reader. Every action was a key press (Tab, Shift+Tab, the arrows, Home, End, Page Up and Down, Enter, Space, Escape, the note letters). Rosa's view is the accessibility tree (`ariaSnapshot()`) plus each control's role, value, description and the live regions. No real VoiceOver or NVDA was run, so what a screen reader *says* is read from the tree, not heard. A tap on the audio output measured whether a key press made sound. MIDI was refused in the headless browser, so the MIDI panel was only seen in its refused state. axe was not run this time; contrast was computed from the styles for the light theme only.

## First impression

**Kai:** "The welcome opens with focus on Play the Demo and keeps Tab inside it. Escape, and I'm on Demo. A plays a C, and I hear it. Tab goes across the header, then down the panels left to right, 56 stops in all, and every one has a ring I can see."

**Rosa:** "One heading, then the header, then four regions. Knobs say 'Cutoff, slider, 2.00 kHz' with their tip as a description, and the arrow step at its end. The Scopes and Spectrums now say what they draw. The piano group tells me which letters play which keys."

## What they tried, in order, and what happened

1. **Welcome (About).** A real modal dialog; focus on "Play the Demo". Tab cycles Take the Tour, Close About, Bead's button, the eight links and back. Escape closes it and puts focus on Demo.
2. **Header Tab order at 1440.** Wordmark, ‹, Patch, ›, Octave up, Octave down, Hold, Tempo, Tap, Demo, Song, Tutorial, About, MIDI, Display: top before bottom in each column, as the screen shows. The piano keys are not Tab stops; the letters play them, and the piano group's description says so ("A to ; are the white keys…, Z and X shift the octave").
3. **The panels.** Osc 1 tab (one stop for the tablist, arrows move it), Waveform (one stop per radio group), Pulse Width, Octave, FM; Filter Mode, Slope, Cutoff…Release; Voices, Legato, Glide, the Amp Envelope, Volume; the "Amp Envelope" legend; LFO 1 and LFO 2. The ring was present on all 56 stops (`:focus-visible` with a 2 px outline).
4. **A sound, made and shaped.** A held: sound and C4 shown pressed. Cutoff: Down 2.00 → 1.89 → 1.78 kHz (a semitone), Page Down 1.00 kHz, Shift+Down 994 Hz, Home 20 Hz, End 20.00 kHz. The letters still play while a knob has focus. Low-pass → High-pass with one arrow. Tempo: Up twice, "122 BPM".
5. **A Preset.**
   - Enter on Patch (`aria-expanded` true) opens the "Patches" panel with focus in Search. Typing "glass", three Tabs, Enter: Glass Keys loads, the panel closes, focus returns to Patch, and the status reads "Glass Keys. Two sines a twelfth apart…".
   - Next Preset (›) loads FM Bell and the status reads its name.
   - The search's own status stays empty whatever is typed, even for "zzzz": no count of what matched is spoken.
6. **Every panel, Enter then Escape.**
   - About and the wordmark: modal dialog, Escape back to the opener.
   - Tutorial list, Display: Tab goes straight into them (they follow their button), Escape returns to the button, and Tabbing past the end now closes them.
   - MIDI: a non-modal dialog that explains MIDI was refused; MIDI Learn and Quick Setup are disabled and skipped. Escape returns to MIDI.
   - LFO Destination: a real menu, focus on the checked item, Escape back to the button.
   - Hold, Legato, Sync: toggle buttons with `aria-pressed`.
7. **The Tour (six cards).** Focus goes to Next and stays there; each card's "Watch…" line is a polite live region. The last card offers "Build a Sub Ladder" and Done; Done, and "Close the Tour", return focus to About. **Escape on the card does nothing.**
8. **A Tutorial (Bass), four Steps.**
   - Picking it focuses Start, then Next. Each Step's text is read out.
   - New: **"Go to the control"**, two Shift+Tabs from Next. It puts focus on the Step's control (the Mixer's Osc 2, the Osc 2 Waveform, Osc 2 Octave). Arrows set it, the reply ("Louder, not different…") is read out, and Next is no longer `aria-disabled`.
   - **Escape on the control brings focus back to Next.** A Step now costs about five keys plus the arrows, against 62 to 159 on 1.21.1. Nothing on the card tells you that Escape goes back; Kai found it by trying. Tab forward instead is 45 to 47 presses.
   - "Quit the tutorial" returns focus to Tutorial. Escape on the card itself does nothing.
9. **The Demo.** Enter on Demo plays it, and each part's name and line are read out. Tab does not stop it. Its card is now folded, so the parts are behind "Unfold the card". The card is last in the page: 49 Tabs from Demo, or two Shift+Tabs from the wordmark. Arrows move through the parts, Enter plays from one, and Escape on a part returns focus to Demo.
10. **Tempo.** Enter on the BPM opens "Tempo in BPM"; Enter after typing returns focus to the spinbutton. Four Enters on Tap change the tempo, but **nothing is announced**: no live region changes and the focus stays on Tap. Its description explains tapping, not the result.
11. **Viewers.** Every Scope and Spectrum is an image with a name and now a description ("The waveform after the Filter: with the high Harmonics taken away it rounds off…"). The LFO plots carry their settings in the name ("LFO 1: Sine, 2.00 Hz, Depth 0 %, on Cutoff").
12. **Focus hidden under the header (Shift+Tab from LFO 2 Sync to the top).** Phone: 0 of 58 stops covered. 200 % zoom: 0 of 54. WebKit phone: 0 of 30.
13. **Light theme.** Header words are #5c6372 on #e6e8ed, 4.92:1. The OSCILLATORS heading is still #06915f on about #e9eef0, about 3.4:1.
14. **WebKit at 1440 (Safari's default Tab, without "Press Tab to highlight each item").** Tab reaches 32 stops: the knobs, faders and the first radio of each group. It skips every plain button: the wordmark, ‹, Patch, ›, Octave up and down, Hold, Tap, Demo, Song, Tutorial, About, MIDI, Display, Legato, the LFO Destinations, Retrig and Sync. The tempo is not reached either. Within the page, so a Safari user who has not changed that setting can shape a sound, but cannot load a Preset, open a panel or take the Tour.
15. **The "Amp Envelope" legend.** It is a Tab stop (`role="img"`, tabindex 0), so its tip can be read. Enter and Space do nothing: a stop without an action between the Amp and the LFOs. A "Filter Envelope" legend joins it when the Filter Envelope is on.

## What worked

- Every goal of the profile met in Chromium: every control reached and changed, notes played, a Preset loaded by search and by ›, every panel opened and closed with Escape except the two cards.
- Focus now returns to its opener when things close: the Tour (Done, Close), a Tutorial (Quit), a Demo part (Escape), the BPM field (Enter).
- "Go to the control", with Escape back to Next, makes a Tutorial a keyboard user's lesson, not a chore.
- The Viewers are described, not only named.
- No stop hides under the header on a phone or at 200 % zoom.
- Popovers close when Tab leaves them.
- **Success criterion met:** a sound made and changed without the mouse, in Chromium.

## Where they got stuck

- **Rosa (Tap):** "I tap the tempo four times and hear nothing. Did it take? What is it now? I have to Shift+Tab to the BPM to find out."
- **Kai (cards):** "Escape closes everything else, but not the Tour or the Tutorial card. I have to Tab to 'Close the Tour' or 'Quit the tutorial'."
- **Kai (Tutorial):** "Escape from the knob back to Next is great, but nothing told me. I only tried it because Escape does that elsewhere."
- **Kai (Safari):** "In Safari, Tab jumps from the knobs to the knobs. Patch, Demo, About, Legato: none of them get focus."
- **Rosa (search):** "I typed in the Preset search and heard no count, not even 'nothing found'."

## Would they

- **Like it?** Kai: yes, the focus no longer gets lost, and the Tutorial is fast now. Rosa: yes, the Viewers finally say what they draw.
- **Share it?** Kai: yes, with keyboard users on Chrome or Firefox; to Safari users with "turn on Press Tab to highlight each item first". Rosa: yes.
- **Come back?** Both yes, for the Tutorials.
- **Recommend?** Kai: yes, to keyboard users on a laptop, and now on a phone keyboard or zoomed in too. Rosa: yes to blind learners, with "Tap is silent" as the one warning.

## Since the last run (1.21.1, 2026-11-02)

- **Fixed:**
  - Focus falling to the page body: the Tour's Done and Close, "Quit the tutorial", Escape on a Demo part and Enter after typing a BPM all return focus to a button now. Escape from inside the MIDI panel was not retested (MIDI refused, its controls disabled).
  - Shift+Tab hiding focus under the header: none hidden on a phone or at 200 % zoom.
  - The light theme's header words: 4.92:1, up from 4.36:1.
  - The phone's tempo button is named "Tempo: 120 BPM".
  - A Tutorial Step's cost: "Go to the control" plus Escape back to Next.
  - Display's panel and the Tutorial list close when Tab leaves them.
  - The Scopes and Spectrums are described.
- **Unchanged:**
  - Tap changes the tempo without a word.
  - Escape does nothing on the Tour and Tutorial cards.
  - The light theme's OSCILLATORS heading, about 3.4:1.
  - The Demo's parts far by Tab (49), though two Shift+Tabs from the wordmark.
- **New:** the Demo card is folded by default, so its parts are behind "Unfold the card". The Preset search gives no spoken count. Safari's default Tab skipping the plain buttons was first measured this run; it is not new in the code.

## Findings, ranked

1. Tap Tempo changes the BPM with nothing announced. Rosa, on Tap, never learns the new tempo or that the taps took. To reproduce: Tab to Tap, press Enter four times; the Tempo spinbutton reads a new value, but no live region changes and Tap's description says nothing of the result. A polite status with the new BPM would do (WCAG 4.1.3).
2. Escape does not close the Tour or a Tutorial card, though it closes every other panel. Escape from a Step's control back to Next works, but nothing on the card says so. To reproduce: About → Take the Tour, Escape on Next, and the card stays; same on a Tutorial's Next. Escape on the card could close it (focus to its opener). "Go to the control" could describe the way back ("Escape returns here").
3. In Safari's default Tab mode, Tab skips every plain button, so a keyboard user cannot reach Patch, ‹ ›, Demo, Song, Tutorial, About, MIDI, Display, Hold, Tap, Legato, the LFO Destinations, Retrig or Sync, while the knobs and the first radio of each group (which carry tabindex 0) are reached: 32 stops against 56 in Chromium. To reproduce: WebKit at 1440 × 900, Escape the welcome, Tab through. Either `tabindex="0"` on those buttons or a line in About or the piano description for Safari users ("Option+Tab, or Settings › Advanced › Press Tab to highlight each item") would close the gap (WCAG 2.1.1).

Also worth an inbox line:

- The Preset search's status stays empty: no "3 Presets" and no "nothing matches" is spoken (WCAG 4.1.3).
- The "Amp Envelope" (and "Filter Envelope") legend is a Tab stop that does nothing on Enter or Space.
- The light theme's OSCILLATORS heading is about 3.4:1 (#06915f on #e9eef0), under 4.5:1 for its size (WCAG 1.4.3).
- The Demo's parts are behind "Unfold the card", at the very end of the page, 49 Tabs from Demo.
