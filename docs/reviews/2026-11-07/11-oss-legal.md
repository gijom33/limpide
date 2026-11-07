# Persona review 11: the open-source legal expert

Ran on 1.26.1 on 2026-11-07 (live bundle `index-BJuJUVYa.js`, which names 1.26.1; `main` at `38df0ad`). Laptop, 30 minutes. Read: `LICENSE`, `package.json`, `package-lock.json` (licence scan, by a script over its `packages` entries), `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/` (templates, `deploy.yml`), `vite.config.ts` (the notices plugin), `src/ui/About.tsx`, `src/ui/C16Card.tsx`, `docs/research/134-history-in-the-tooltips.md` and `173-circuit-tracks.md`, issue 111; the live site's `index.html`, JavaScript and CSS bundles, `third-party-notices.txt` and GoatCounter's `count.v4.js`, fetched with `curl` into a scratch folder; `gh api` for the repository's settings, community profile, contributors and the 1.26.1 Release. Nothing installed, nothing in the repository changed besides this report.

This is a compliance read, not legal advice. Where a point turns on a country's law, it is marked **lawyer to confirm**.

## First impression

"Still MIT, still three MIT packages in the browser, and the community profile is now at 100 %: a SECURITY.md has appeared and GitHub's private reporting is on. The notices file now ends with Limpide's own licence. So the hygiene items are done; what a company's intake would look at now is what the page says about privacy and how it names other people's products, since the app has grown History lines full of Moog, Prophet-5 and Yamaha, and a printable card for a third-party controller."

## Since the last run (1.16.0, 2026-10-30)

- **Security reporting: fixed.** `SECURITY.md` (supported versions, what there is to attack, report through the Security tab); `private-vulnerability-reporting` → `{"enabled":true}`. My finding 1 of 2026-10-30 is closed, without an email address, as the owner wanted.
- **AI-assisted contributions: fixed.** CONTRIBUTING asks for a `Co-Authored-By` line naming the tool (issue 111, decision 3).
- **DCO: declined by the owner** (issue 111, decision 2: nobody has contributed yet; MIT inbound = outbound covers it). A reasonable call; I don't raise it again until there is an outside contributor (today: none, 0 pull requests).
- **Limpide's own licence in the notices: fixed.** The live `third-party-notices.txt` ends with "Limpide 1.26.1" and the full `LICENSE`; a deployed fork is self-contained.
- **The copyright wording: parked by the owner** "for a lawyer" (decision 4); unchanged.
- **Privacy wording: changed, and less precise.** About's Privacy entry went from "it receives your IP address and browser" to "no cookies, nothing that identifies you" (2026-11-02, the owner's pick); SECURITY.md says "an anonymous visit count". Finding 1 below.
- **New third-party material:** the History lines in the tips (34 cited sources, short quotations of manuals and patents), the C16 card page (`#c16-card`), a Circuit Tracks research pass, the Song (About: "The Demo and the Song are originals"). No new images, fonts, samples or runtime dependencies.

## What they tried

1. **Licence.** `LICENSE` unchanged (MIT, `Copyright (c) 2026 Guillaume Boillet`); GitHub reports `MIT`; `package.json` `"license": "MIT"`, `"private": true` (not published to npm, so the licence travels only with the repository and the site). README and About: MIT covers "the code, the Presets, the music and the docs".
2. **Lockfile scan.** 139 packages (120 on 1.16.0): MIT 85, Apache-2.0 26, MPL-2.0 12, `MIT OR Apache-2.0` 9, BSD-3-Clause 4, ISC 3. None without a licence field, no GPL or LGPL family, no source-available licence. Production: `react` 19.3.1, `react-dom` 19.3.1, `scheduler` 0.28.0, all MIT, unchanged. MPL-2.0 is still only `lightningcss` and its platform binaries, a build tool, unmodified, not shipped. The CI's Playwright container image and GitHub's own actions run the tests and the deploy only; nothing of them ships.
3. **What the site ships.** `index.html` loads one JavaScript bundle and one stylesheet from its own origin, and GoatCounter's script. The CSS uses system font stacks only (`system-ui`, `ui-monospace`), so no font licence. The bundle's outbound URLs are the repository, React's error page, aihero.dev, goatcounter.com and the owner's LinkedIn. No code in `src/` is marked as copied or adapted from elsewhere. The 1.26.1 Release carries no binary assets, so the site is the only distribution of built code.
4. **Third-party notices, live.** React, react-dom (with its embedded "Modernizr 3.0.0pre (Custom Build) | MIT" line), scheduler, then Limpide's own licence, 107 lines, linked from About. Generated from `node_modules` by the build, so a new runtime dependency cannot be forgotten. This is what MIT asks of a minified bundle.
5. **The counter.** The script tag still pins `count.v4.js` with `integrity="sha384-nRw6…dxI+"`; I hashed today's live file and it matches. `deploy.yml` still sets `GOATCOUNTER_URL` only for `gijom33/limpide`, so a fork never counts. The script sends the path, title, screen size and referrer (it reads `document.referrer`), and GoatCounter receives the visitor's IP address and user agent with the request.
6. **What the page says about it.** README: "no cookies, and no personal data stored. Like any web page, it receives each visitor's IP address and browser to count them". About: "no cookies, nothing that identifies you. Your sounds never leave your browser." SECURITY.md: "nothing sent anywhere but an anonymous visit count". Three wordings of one fact; the README's is the accurate one.
7. **Third-party names.** Shipped strings name the TempoPAD C16 (a whole page headed "Limpide on the TempoPAD C16", and the C16 layout), Moog and the Minimoog, the Prophet-5 and Sequential, Roland's SH-101 and Juno and Jupiter, Yamaha's DX7, Chrome, Edge, Safari and Apple, Anthropic and Claude Code. Each use names a product to say what it did or that Limpide works with it: nominative use, no logos, no claim of endorsement. Nowhere does the site or the README say these are their owners' marks or that Limpide is unaffiliated. The research passes read Synido's and Novation's guides for facts (MIDI messages), which copyright does not protect; nothing of their text is reproduced beyond names of controls.
8. **Quotations in the docs.** `docs/research/134-history-in-the-tooltips.md` quotes manuals, patents and Wikipedia; the longest quotation I found is about 100 characters, each attributed with its source. That is quotation, not copying (US fair use, EU Article 5(3)(d) InfoSoc). But the README's blanket "MIT … the docs" reads as licensing those quotations too, which the owner cannot do (Wikipedia's text is CC BY-SA, the manuals all rights reserved). Low risk at this size.
9. **Contributions.** CONTRIBUTING and the PR template: contributions are under MIT, as the project; AI help marked with `Co-Authored-By`. All 1,481 commits are the owner's; no outside contributor yet.
10. **Code of conduct.** Contributor Covenant 2.1 by reference (not copied, so no CC BY attribution owed); the only private contact for a conduct report is still the owner's LinkedIn. The Security tab's private reporting is for vulnerabilities, not conduct.
11. **Supply chain.** Secret scanning and push protection on; Dependabot security updates off. With three runtime packages pinned in the lockfile, low risk, but an intake checklist (OpenSSF Scorecard's Dependency-Update-Tool) notes it.

## What worked

- Every finding of 2026-10-30 is fixed or decided by the owner with a stated reason, in issue 111: the trail a compliance reviewer wants.
- The build writes complete notices itself, ending with Limpide's own licence; the counter is opt-in per deploy and integrity-pinned. A fork inherits both.
- Runtime dependencies: three MIT packages; the development tree: permissive plus one unshipped MPL-2.0 tool.
- AI authorship is disclosed in the README, About, CONTRIBUTING and every commit, and contributors are asked to do the same.
- The History lines cite their sources and grade them, which also makes their quotations attributable.

## Where they got stuck

- **The privacy wording drifted.** "Nothing that identifies you" (About) and "an anonymous visit count" (SECURITY.md) claim more than the README admits. An IP address is personal data under the GDPR when it can be linked to a person (CJEU, *Breyer*, C-582/14), and GoatCounter receives one with every visit, even if it stores none; GitHub Pages also receives and logs every request, which nothing mentions; the referrer and any query string (`?utm_source=…`) reach GoatCounter too. For a personal, non-commercial demo the risk is small, but a regulator or a careful visitor reads "nothing that identifies you" as a promise. **Lawyer to confirm** what GDPR Article 13 asks of a site this size.
- **No trademark line.** The app now names a dozen makers' products, one of them in a page title ("Limpide on the TempoPAD C16"). Fair as used; the common hygiene is one sentence saying the names are their owners' trademarks and Limpide is not affiliated with or endorsed by them.
- **The copyright line** in the README still claims "the code" outright, two lines below "code written with Claude Code". Parked by the owner for a lawyer. My view as a reviewer, not advice: `LICENSE`'s line is the standard one and can stay; MIT grants only what the licensor holds, so the overclaim harms nobody who relies on it. The risk is the reverse: the owner relying on it to enforce. **Lawyer to confirm**, with the AI provider's current terms on outputs.
- **Minor:** the README's "MIT … the docs" covers the research passes' quotations; one clause ("quotations stay their authors', under their own terms") fixes it. Conduct reports have only LinkedIn as a private channel. Dependabot security updates are off.

## Would they

- **Approve use by a company (the hosted site, or internally): yes.** Permissive licences only, complete notices shipped, a cookieless counter disclosed.
- **Approve a fork: yes, without changes.** Notices and licence travel with the build; a fork doesn't count visitors.
- **Approve a contribution: yes.** Inbound = outbound under MIT and an AI-disclosure rule; a company that insists on a DCO would ask the employee to sign off anyway, which the project doesn't forbid.
- **Approve publishing it as it stands: yes.** Nothing below blocks; they are wording.
- **Recommend it as an example of a well-run solo project: yes.** Each reviewer finding is answered in an issue with who decided and why.

## Three findings, ranked

1. About's Privacy ("nothing that identifies you") and SECURITY.md ("an anonymous visit count") claim more than the README's accurate "receives each visitor's IP address and browser": say in About that GoatCounter receives the IP address and browser to count the visit and stores no IP address (checked against GoatCounter's own privacy page), "a cookieless visit count" in SECURITY.md, and name GitHub Pages' logs in the README (lawyer to confirm for GDPR Article 13).
2. The site names a dozen third-party products (the TempoPAD C16 in the `#c16-card` page title, Moog, Prophet-5, Juno, DX7, Chrome, Safari…) with no trademark line: add one sentence to About and the README, "Product names are their owners' trademarks; Limpide is not affiliated with or endorsed by them".
3. The README's License line still claims "the code" outright and covers the docs' quotations of manuals and Wikipedia: keep `LICENSE` as it is, add "quotations in the docs stay their authors'" to the README, and get the parked AI-authorship wording (issue 111, decision 4) in front of a lawyer before anyone relies on it to enforce.
