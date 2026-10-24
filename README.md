# Limpide

**A subtractive synthesizer that shows you what each stage does to the sound.**

▶ **[Play it in your browser](https://gijom33.github.io/limpide/)**. Nothing to install.

Ordinary synths give you a sound and a row of knobs, and the cause and effect stays hidden in the signal. Limpide is laid out as its own signal-flow diagram: Oscillators → Mixer → Filter → Amp, left to right, with live Viewers under every stage. Turn the Cutoff and you can see which Harmonics the Filter takes away.

## What you can do

- **See the subtraction.** Each stage has a cycle-locked Scope and a Spectrum. The Filter's real Response Curve is drawn over the Spectrum.
- **Check Harmonics against theory.** Markers name each Harmonic, and an Ideal Reference shows what theory predicts for the Waveform.
- **Watch modulation over time.** The Envelope Timeline draws both Envelopes, the LFO and the Effective Cutoff as they move.
- **Study a moment.** Freeze, A/B Snapshots, axis toggles and a hover readout. Hold keeps a note sounding while you turn knobs.
- **Play however you like.** Use the computer keyboard (`A W S E D F T G…`, with `Z`/`X` to change octave), the on-screen piano, or any MIDI controller via MIDI Learn. Patches can have one to eight Voices.
- **Keep and share sounds.** Presets to start from, autosave, a named Patch library, JSON export, and share links that carry the whole Patch in the URL.

Works best in **Chrome or Edge**. Safari has no Web MIDI, so MIDI controllers don't work there; everything else does.

Visits to the site are counted with [GoatCounter](https://www.goatcounter.com): no cookies and no personal data.

## Run it locally

You need [Node.js](https://nodejs.org) 22.12 or newer.

```bash
git clone https://github.com/gijom33/limpide.git
cd limpide
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app with live reload |
| `npm run build` | Type-check and build the static site into `dist/` |
| `npm run test:unit` | Fast unit tests (Node) |
| `npm run test:engine` | Audio engine tests in headless Chromium |
| `npm run test:e2e` | End-to-end tests with Playwright |

The browser tests need Playwright's Chromium once: `npx playwright install chromium`.

## How it's built

TypeScript, React and Vite, on the browser's native Web Audio nodes; no audio libraries.

- [CONTEXT.md](CONTEXT.md): the project's vocabulary (Patch, Voice, Tap, Effective Cutoff…). Code and docs use these words exactly.
- [docs/adr](docs/adr): architecture decisions and why they were made.
- [docs/issues](docs/issues): the vertical slices the app was built in, in order.

Every push to `main` is tested and deployed to GitHub Pages by [a workflow](.github/workflows/deploy.yml).

## License

[MIT](LICENSE) © Guillaume Boillet
