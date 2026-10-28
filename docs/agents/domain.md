# Domain docs

How the skills read this repository's domain documentation. Single-context: one glossary and one ADR folder at the root.

## Before exploring, read these

- **[`CONTEXT.md`](../../CONTEXT.md)** at the root: the glossary. A skill that asks for `GLOSSARY.md` means this file ([ADR-0012](../adr/0012-following-the-ai-hero-skills.md), point 2).
- **[`docs/adr/`](../adr/)**: the ADRs touching the area you work in. An accepted ADR changes only in its Status line; a reversal is a new ADR.
- **[`docs/prd.md`](../prd.md)** for what the product is, and **[`docs/design-principles.md`](../design-principles.md)** before any change to the layout or the look.

## Use the glossary's words

When naming a domain concept (an issue title, a test name, a variable), use the word `CONTEXT.md` defines and capitalises: a Note, a Patch, a Preset, the Filter Envelope, a Viewer, a Tap. Don't drift to the synonyms it lists under "Avoid". A concept missing from it is either invented language (reconsider) or a gap (add it with `/domain-modeling`).

## Flag ADR conflicts

If what you propose contradicts an ADR, say so rather than overriding it silently:

> _Contradicts ADR-0005 (monophonic by design), but worth reopening because…_
