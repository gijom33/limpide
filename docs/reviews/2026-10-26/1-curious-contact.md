# Review 1: the curious contact (knows nothing about music)

- **Who:** a LinkedIn contact who taps the link out of curiosity. Has never touched a synth.
- **Device:** iPhone 15 emulation in Playwright WebKit (touch, mobile). The screen is 393 × 852; the page gets 393 × 659 once Safari's own bars are taken out.
- **Site:** https://gijom33.github.io/limpide/, version 1.8.1, build 2ba9f3a, fresh browser with nothing stored.
- **Budget:** a first pass of about 60 seconds, then a second look of about 2 minutes.
- **Screenshots:** `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/1-curious-contact/`. Paths below are short names in that folder.
- **Sound:** I could not hear anything. The page's audio engine was paused at load and started running on the first tap ("Play the Demo"), and its clock kept advancing. Keys lit up green, the plots moved and the numbers changed in time with the notes. So sound was very likely playing, but nobody checked it by ear. This includes the iPhone silent switch: the code asks Safari to play through it, but that was not checked on a real phone.

## First impression

"Oh, a nice dark app with a rainbow squiggle logo. A box says *Limpide: A subtractive synthesizer that shows you what each stage does to the sound.* I don't know what 'subtractive' or 'stage' means, but 'synthesizer' means music. There's a big orange **Play the Demo** button, so I'll press that. I can see piano keys behind the box, so I can probably play it too." (`01-landing.png`)

In ten seconds they understood that it's a music app made by Guillaume, that it's free, and which button to press. They did not understand what it "shows".

## What they tried

**First pass, about 60 s**

1. Read the welcome box and tapped **Play the Demo**. The box closed and the page jumped down, so the Limpide logo, the Demo button and the sound's name all slid off the top. What's left is a mini piano pinned at the top, the tabs OSC / FILTER / AMP / LFO & ENV, and an orange FILTER panel full of knobs that turn on their own. Keys light up green. The lines in the two black boxes wiggle in time with the notes. (`10-demo-1s.png`, `12-demo-8s.png`)
   - *"Ooh, the knobs move by themselves and the lines dance. Cool. But what am I looking at? 'Cutoff', 'Resonance', 'Key Track', '+3.5 oct', '-24 dB'…"*
2. Watched while the Demo kept jumping between panels: FILTER, then AMP (purple), then OSCILLATORS (green), then LFO & ENVELOPES (blue). That last one has a graph of many coloured spikes. (`13-demo-scrolled.png`, `14-demo-scrolled-more.png`, `w27.png`, `w52.png`)
   - *"The colourful spikes are pretty. It looks like a music video equaliser."*
   - Nothing on screen says which sound is playing or what is happening. The sound's name (Kick, Acid, Poly Pluck, Strings, Self-Oscillation, Wobble, Brass Section) only shows in the header, which had slid away.
3. About 10 to 20 seconds in, tapped a piano key to join in. The Demo stopped silently. The tapped note played, the plots showed it, and nothing said "Demo stopped". (`30-A-after-key-tap-mid-demo.png`, `15-tap-key-during-demo.png`)
   - *"Did I break it? It went quiet."*

By the end of 60 seconds they had heard sound, seen it move, and stopped the Demo by accident. They were curious enough to take a second look.

**Second look, about 2 min**

4. Swiped up. The header came back: the logo, the sound's name "Acid •", and Demo / Song / Hold. (`31-A-scroll-up.png`)
5. Tapped **Demo** again, and it restarted from the beginning. Tapped **Song**: the sound changed to "Poly Pluck" and a tune played, with the Song button lit. (`18-song-3s.png`)
   - *"Nice, a little tune."*
6. Tapped the **›** arrow next to the sound's name: "Strings", then "Brass Section". Pressed a key and the green waveform changed shape. (`19-next-preset.png`, `20-holding-C4-preset.png`)
   - *"Oh, I can flip through sounds. That's the fun bit."*
7. Tapped the sound's name. A long list opened with the headings Start / Shapes / Intervals / Filter: "Init", "Pure Sine", "Hollow Square", "PWM Morph", "Tritone Knot", "12 vs 24", "Key Track Demo"… (`22-patch-menu.png`)
   - *"These sound like a school lesson. Where are the fun ones like 'Wobble' and 'Brass'?"*
8. Tapped **About**. It shows the same text as the welcome box. (`23-about.png`)
9. Tapped **Display**, which shows Freeze / Space / Snapshot / Voices / Freq Log Lin / Harmonics / Ideal / Maths. (`24-display.png`) *"No idea."* Closed it.
10. Tapped **MIDI**, because its icon is red and crossed out like an error. It says no iPhone browser supports Web MIDI, "everything else works here". (`25-midi.png`) *"OK, it's not broken, just not for me."*
11. In a second session I tapped **Explore** instead of the Demo. The piano and an "Init" sound appeared, with a green saw-tooth line and spikes. Tapping C4 played it. Then I turned on **Hold**, held C4, opened FILTER and dragged the **Cutoff** knob down. The value went from 2.00 kHz to 32 Hz, the spikes disappeared from the right of the plot, and the line flattened. Most likely the sound turned muffled. (`32-B-after-explore.png`, `34-B-1s-after-key-tap.png`, `37-B-dragging-cutoff-down.png`)
    - *This is the real "it shows you what sound looks like" moment. The persona would only find it by luck: nothing on a phone told them to drag Cutoff, or what it would do.*
12. Tapped the Cutoff knob once, then pressed and held it, hoping for an explanation. Nothing appeared. (`41-longpress-cutoff-knob.png`) In the code, the explanation boxes (for example "Envelope Amount: How far the Filter Envelope moves…") open only on mouse hover or keyboard focus (`src/ui/Tooltip.tsx`), so a phone visitor never sees them.

## What worked

- The welcome box. It is short, and the big orange **Play the Demo** button is clearly the thing to tap. Sound starts from that one tap.
- The Demo looks great. Knobs turn on their own, keys light up and the coloured plots dance. It reads as "this is clever and well made" even without understanding any of it.
- The piano stays pinned at the top while scrolling, so there is always something to tap. Tapping a key always did something visible.
- The **›** arrow to flip between sounds, and **Song**, are the most fun things for this persona.
- The MIDI message is honest and calm once opened.

## Where they got stuck or gave up

- **During the Demo, nothing explains what's happening.** The persona saw moving parts labelled only with jargon (Cutoff, Resonance, Key Track, oct, dB, Hz). The sound's name and the Demo button were scrolled off the top for the whole Demo, so they never knew it was touring "Kick → Acid → Poly Pluck → Strings → Wobble → Brass".
- **They stopped the Demo by accident**, by tapping a key, and got no feedback. To start it again they first had to work out that swiping up brings the header back.
- **The Demo is long.** It was still going at 72 s (eight sounds in), past the whole first-pass budget, and nothing shows how far along it is.
- **No explanations on a phone.** Tapping or long-pressing a control shows nothing, so the app does not explain itself on touch. The welcome box's "subtractive synthesizer… each stage" is the only prose they get, and it is jargon too.
- Display, the crossed-out red MIDI icon, and preset names like "Tritone Knot" or "12 vs 24" all signalled "this is for experts".
- Gave up after about 3 minutes, smiling but without being able to say what the plots mean.

## Would they…

- **Like the post: yes.** It's a friend's project, it looks polished and pretty, and it made sound from one tap.
- **Share it: no.** They can't say what it is beyond "a synth app with dancing lines". They'd worry their own contacts wouldn't get it either.
- **Come back: no.** Nothing left them with a question they wanted answered, or a goal like "make a sound I like and save it".
- **Recommend it: yes, but only to a friend who plays music**: "you'd get this, it's beautiful".

Could they say "it shows you what sound looks like"? Almost. They'd say "the lines move with the music". Only the lucky Cutoff drag in step 11 shows a cause and its effect, and that is the thing that would make them say the line.

## Three findings, ranked

1. **The Demo has no plain-words narration on a phone, and the sound's name is hidden while it plays.** The header scrolls off for the whole Demo, so the visitor sees knobs labelled Cutoff, Resonance, oct and dB moving with no caption such as "Acid: the filter opens and closes". Seen at 393 × 659 (iPhone 15, WebKit). Screenshots: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/1-curious-contact/12-demo-8s.png`, `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/1-curious-contact/w52.png`.
2. **A phone visitor cannot reach any explanation.** Tooltips open only on mouse hover or keyboard focus (`src/ui/Tooltip.tsx`, `pointerType === 'mouse'`), and a tap or long-press on the Cutoff knob showed nothing. So on touch the app never explains a control. Seen at 393 × 659. Screenshot: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/1-curious-contact/41-longpress-cutoff-knob.png`.
3. **The Demo runs over 70 s with no progress shown, its stop button is scrolled away, and tapping a piano key stops it silently.** Demo turned off 1 s after a key tap at 10 s, with no message, and the Demo button off-screen. A first-time visitor thinks they broke it. Seen at 393 × 659. Screenshot: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/1-curious-contact/30-A-after-key-tap-mid-demo.png`.

Also noticed, not ranked:
- The welcome line "A subtractive synthesizer that shows you what each stage does to the sound" is jargon for this persona (`01-landing.png`).
- The red crossed-out MIDI icon reads like an error on iPhone (`01-landing.png`).
- In my Playwright runs an "Envelope Amount" tooltip appeared during the Demo (`11-demo-4s.png`). That came from the test browser's leftover mouse pointer, not from touch, so a real iPhone would not show it.
