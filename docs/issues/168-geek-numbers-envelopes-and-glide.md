# 168: Geek numbers: the Envelopes and Glide

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 9 and 10 (Glide). Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Ok for now, we will revisit the geek overlay via an agent later."; what the layer keeps beyond History is for profile 19's review, later ([42](./42-reviews.md))

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, the Envelopes and Glide write the numbers and formulas the engine computes, as 133's decisions 9 and 10 (Glide) say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, both Envelopes' Decay and Release readouts add their time constant τ ("300 ms · τ 65 ms"), as the engine uses it; their tips explain τ (63 % of the way) and the curve's formula, Attack being a straight rise; Glide's tip gives its slide curve's formula. Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [ ] Decay and Release readouts show τ matching the engine's time constant (an engine test on the Amp Tap)
- [ ] The tips' formulas under the hood, Attack's straight rise said
- [ ] Glide's tip gives its curve
- [ ] With the layer off nothing changes; every test passes in Linux's fonts too

## Questions for the owner

Found on 2026-11-01, before building, measuring the page and reading the engine. Nothing is built: Glide's formula and the tips wait with the readouts, so the issue comes in one piece.

1. **Where the faders' τ goes.** "300 ms · τ 75 ms" cannot sit under a fader at any width. A fader's column is 40 to 56 px from 320 to 1920 px wide, and that readout takes 85 to 111 px, about twice the column, so it would run over the next fader. A second line under the fader does not fit either: the faders are the tallest controls in the Envelopes' rows, so the rows would grow (at 1440 × 900 the page is already exactly 900 px tall), or the faders would jump up when the layer is turned on. The choices:
   - (a) **τ in place of the time** while the layer is on, as Sustain's dB takes the place of its % ("τ 75 ms"). The time stays in the value bubble, the tip and the screen reader. Two figures fit every column ("τ 75 ms" is 38 to 41 px), but below 1 ms ("τ 0.25 ms", 48 to 52 px) and from 100 ms up ("τ 250 ms", 45 to 48 px) it runs over in the narrower columns (41 to 47 px: from 601 to 1330 px wide, and at 320 px).
   - (b) **τ live in the tip**, under Under the hood, worked out for the fader's setting ("τ = Decay ÷ 4 = 75 ms now"). The readouts stay as they are, and it fits on every screen, the phone's touch-and-hold tip included. But it is not beside the control, which decision 2 asks for.
   - (c) **τ drawn on the Envelope Timeline**, at each Decay and Release curve, with the Viewers' slice ([170](./170-geek-numbers-viewers.md)).

   Claude's recommendation: (b). It is the only place that fits at every width with no figures cut, and the tip already holds the curve that τ belongs to. (c) could follow with 170 if the owner wants τ on screen while playing.
2. **Attack is not a straight rise in the engine.** Decision 9 says it is, but the engine gives Attack the same curve as Decay and Release (an analogue-style RC curve). It rises towards its peak with τ = Attack ÷ 3, which is 95 % of the way there when the Attack time is up. Decay's τ is Decay ÷ 4 (98 % of the way at its time), Release's is Release ÷ 6 (99.75 %). So the 300 ms Decay of the default Patch has τ 75 ms, and a 300 ms Release has τ 50 ms. Decision 1 says the layer writes what the engine computes. The choices:
   - (a) The tip says what the engine does: Attack is a curve too, with its τ.
   - (b) The engine's Attack becomes a straight rise, as on many synths. That changes the sound of every Patch (a straight Attack sounds slower to start and harder at its top), and the Envelopes' drawings would follow. It is a change of sound for its own issue.

   Claude's recommendation: (a). If (a), should the Attack fader show its τ too, as Decay and Release do (whatever question 1 settles)? Claude's recommendation: yes, so all three curves read the same way.

## Decisions (the owner's answers, 2026-11-01)

The owner answered "ok" to both recommendations above:

1. **τ lives in the tip,** decided by the owner: each Envelope fader's tip works out τ live under "Under the hood" ("τ = Decay ÷ 4 = 75 ms now"); the faders' readouts are unchanged. τ drawn on the Envelope Timeline may follow with 170 later, not part of 168. This replaces the readout "300 ms · τ 65 ms" of the Desired behavior and of 133's decision 9.
2. **Attack is a curve too,** decided by the owner: the tip says what the engine does, Attack rising with τ = Attack ÷ 3, and the Attack fader's tip shows its τ like Decay's and Release's. The criterion "Attack's straight rise said" reads, since then, "Attack's curve and its τ said".

## How it was built

Built on 2026-11-01 on night/2026-11-01, test-first, as the Decisions above say.

- **Each Envelope fader's tip** (Attack, Decay and Release, the Filter's and the Amp's), with the Synth Geek Layer on, gives under "Under the hood" its stage's curve and its τ worked out at the fader's setting, live as it moves: Attack `x = 1 − (1 − x₀)·e^(−t/τ)`, "τ = Attack ÷ 3 = 3.33 ms now", a curve, not a straight rise, 95 % of the way by the Attack time; Decay `x = S + (x₀ − S)·e^(−t/τ)`, ÷ 4, 98 %; Release `x = x₀·e^(−t/τ)`, ÷ 6, 99.75 %. Each says τ is 63 % of what is left of the way. The faders' readouts are unchanged.
- **Glide's tip** gives its slide, `f = f₂ + (f₁ − f₂)·e^(−t/τ)`, τ = Glide ÷ 4, 98 % by the Glide time: the rule, with no live number, as 133's decision 10 says.
- The divisors are the engine's own (the Envelope's sharpnesses and Glide's, now exported as their one source), and engine tests hold each τ to the sound: on the Amp Tap the Attack is 63 % up after its τ, the Decay and Release 63 % further down; the pitch is 63 % of the way to the new Note after Glide's τ. The Geek spec checks the tips with the layer on only and the readouts as they were; the 375 px phone's touch-and-hold tip shows Decay's τ whole.
- On the way, a time a hair under a second (0.9995 to 1 s) wrote "1.00e+3 ms", on a fader's readout as in its τ: it now reads "1.00 s".

Calls, Claude's call, open to the owner:

1. The τ reads to three figures, in ms under a second ("75.0 ms", "0.250 ms") and in seconds from there ("1.67 s"), as the faders' times do.
2. The curves' level x is a share of the peak, so one formula serves both Envelopes (the Amp's peak is the Velocity, the Filter's full), and x₀ is where each stage starts: the Decay starts from where the Attack got to (95 %), not from the peak.
3. Only the Amp Envelope is held to the sound by an engine test; the Filter Envelope's τ comes from the same schedule.

**To try:** turn on Display's Geek. Hover the Amp's Decay: the tip reads "τ = Decay ÷ 4 = 75.0 ms now"; move the fader with the keys and watch τ follow. Hover Attack (a curve, ÷ 3) and Release (÷ 6), the Filter Envelope's too, and Glide (its curve, no number). On a phone, hold a fader for its tip. Turn Geek off: the tips lose their "Under the hood" line.
