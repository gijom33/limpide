# Contributing to Limpide

Thank you for looking. Limpide is a small project with one owner, so the easiest help is a clear report of what went wrong, or an idea that would make the sound easier to understand.

## Report a bug or suggest an idea

Open a [GitHub Issue](https://github.com/gijom33/limpide/issues/new/choose). For a bug, the form asks for what you did, what you expected, what happened, and your browser and screen size: that is usually enough to find it. Screenshots help.

The owner's own notes go to [docs/inbox.md](docs/inbox.md) and from there into numbered issues in [docs/issues](docs/issues); a GitHub Issue that is taken up gets a line there too.

## Run it

You need [Node.js](https://nodejs.org) 22.12 or newer.

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | The app, with live reload |
| `npm run typecheck` | TypeScript, no build |
| `npm run lint` | Biome: React hooks rules, imports organised |
| `npm run test:unit` | Unit tests (Node) |
| `npm run test:engine` | The audio engine in headless Chromium |
| `npm run test:e2e` | The built site in Chromium and WebKit, with Playwright (`npx playwright install chromium webkit` once) |

Every push to `main` runs all of these before it deploys.

## Before you change code

- Read [CONTEXT.md](CONTEXT.md): the code and the docs use its words exactly (a Patch, a Voice, a Tap, the Effective Cutoff).
- The decisions that shape the code are in [docs/adr](docs/adr); the product is described in [docs/prd.md](docs/prd.md). A change that goes against either is a conversation first: open an Issue.
- New behaviour comes with a test: a unit test where the logic is plain, the engine tests where it is sound, Playwright where it is the page.
- Keep a pull request to one thing, and say in it what you tested and in which browsers.

## What help is welcome

- Bug reports from browsers and devices the tests don't cover (Firefox, Android phones, screen readers).
- Presets and Tutorials that teach one idea well.
- Accessibility: anything a keyboard or screen-reader visitor can't reach.

## How the project is run

The owner decides what Limpide is and what ships; the code is written with Claude Code, and every commit says so. The README's [How this was built](README.md#how-this-was-built) explains the method.

By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md). Contributions are under the [MIT License](LICENSE), as the rest of the project.
