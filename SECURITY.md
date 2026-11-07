# Security

## Supported versions

Only the live site, [gijom33.github.io/limpide](https://gijom33.github.io/limpide/), and the latest release are supported. A fix goes out as a new release; older versions get none.

## What there is to attack

Limpide is a static page: no server of its own, no accounts, nothing sent anywhere but a visit count without cookies ([GoatCounter](https://www.goatcounter.com)). Like any web page, its host (GitHub Pages) and the counter receive each visitor's IP address and browser; Limpide itself keeps nothing that identifies a person. What it reads from outside:

- **A shared link,** which carries a Patch after the `#`;
- **a MIDI keyboard or controller,** through the browser's Web MIDI;
- **the browser's own storage,** where it keeps the person's Patches and settings.

A link or MIDI message that makes the page run code, read or change what it stores, or hang the browser is a vulnerability worth reporting.

## Reporting a vulnerability

Please report it privately, not in a public issue: on the repository's **Security** tab, choose **Report a vulnerability**. The report reaches the owner alone; the fix is made in private and published with a new release, crediting you if you wish.

This is a one-person project, so allow a few days for a first answer.
