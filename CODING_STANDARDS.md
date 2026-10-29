# Coding standards

The judgement calls a review holds a change to. What a tool checks (types, the lint, commit subjects, the inbox rules) is left to the tool. Read beside [CONTRIBUTING.md](CONTRIBUTING.md) (a test with every new behaviour), [CONTEXT.md](CONTEXT.md) (the words), [docs/design-principles.md](docs/design-principles.md) (any change to the screen) and [docs/adr](docs/adr).

## Docs follow the behaviour

A change that makes something untrue fixes it in the same commit: a tooltip (`src/ui/tips.ts`), a Preset's or Tutorial's text, a code comment, `CONTEXT.md`, the PRD, an ADR's consequences (by a new ADR when it is accepted), and the Status, Decisions or "how it was built" notes of the issues that describe it, done ones included (a dated line saying what changed since). Search for the behaviour's words, not only the file changed: the 1.14 reviews found issue 63 and the Env Timeline's tooltip still describing what had changed.

## Code the app uses, once

- **Every branch serves a caller.** A branch, field or option that only a test reaches is dead: remove it, with its test, rather than keep it for later.
- **One shape, one place.** The same steps for several siblings (each modulation ring shown or hidden and its path set, each Timeline line drawn) live in one helper they all call; a CSS rule that copies another shares its selector instead.
- **Many positional arguments become one options object** once a call can't be read without the signature.
- **The same question asked in several files** (which categories list Presets, which Step kinds act) is answered once, where the thing is defined.
- **A silenced dependency check names what it leaves out, and why the result cannot depend on it.** A `biome-ignore` of `useExhaustiveDependencies` is a claim about what the function reads: check it against the function's body. The Ideal Reference's memo claimed to list what it depended on, missed six of Osc 2's values, and its marks ignored Osc 2 (issue 77).

## Names

Domain names use `CONTEXT.md`'s words, capitalised as there (a Note, the Filter Envelope, a Preset). A name says what a thing is now: when its meaning changes, it is renamed (the Ideal's marks are no longer rings; a matcher that reads descriptions is not `matchesName`).

## Comments

A comment says why, in a sentence or two, and who asked when the owner did: "(the owner, 2026-10-28)" or the issue's number. It describes the code as it is, never its history.

## The architecture

- The Viewers and the engine live outside React ([ADR-0002](docs/adr/0002-viewers-and-engine-live-outside-react.md)): the render loop reads refs, never React state.
- `engine.modulationAt` mirrors the audio graph ([ADR-0003](docs/adr/0003-modulation-model-mirrors-the-audio-graph.md)): a new modulation path changes both, and a test compares them.

## Tests

- A test's name says the behaviour, and where it came from: an issue, or "(the owner, YYYY-MM-DD)", or "(the 1.14.0 review)" for a regression.
- Playwright finds elements by role and accessible name, with `exact: true` wherever another element's name could contain it: the Demo button and a Preset named with "Demo", a ring class that another ring's class extends.
- Timing-sensitive steps run inside the page (one `evaluate`), not as many round trips that a loaded machine stretches.
- A change on screen meets the design audit (`e2e/designPrinciples.spec.ts`): a target smaller than the principles' sizes needs a waiver with a floor there.
