# 172: No tip link

**What to build:** The owner's decision (inbox, 2026-10-31), on Stripe's business-type form while setting up Buy Me a Coffee: "I am not sure this \"BuyMeCoffee\" idea is a good one. Looks like complications for not much benefit. I do not think many people will send money." Of Claude's three options, "I choose 1": remove the link for v1, and invite what helps instead. Undoes [146](./146-a-tip-link-in-about.md); see [.out-of-scope/tip-link.md](../../.out-of-scope/tip-link.md). Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "Good."

## Decisions

1. **No tip link in v1:** About's Support entry and the README's line to Buy Me a Coffee go. Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **What About invites instead,** in the Support entry's place: "Enjoying Limpide? Share it, or star it on GitHub", "star it on GitHub" linking to the repository. The README's line becomes "Enjoying it? Share it, or ⭐ the repository."
3. **The owner's account** (Buy Me a Coffee and its Stripe setup) is the owner's to close or leave; nothing in the repository points to it.

## Agent Brief

**Category:** enhancement
**Summary:** Remove the Buy Me a Coffee link from About and the README, and invite sharing or a GitHub star in its place.

**Current behavior:** About's credits have "Support: Enjoying Limpide? Buy me a coffee", and the README a line, both linking to the owner's Buy Me a Coffee page.

**Desired behavior:** No link to Buy Me a Coffee anywhere. About's credits have, in its place, a line inviting the person to share Limpide or star it on GitHub (the repository's link); the README the same in its words. Issue 146's file gets a dated line saying the link was taken out by this issue.

**Key interfaces:**
- About's credits and the constant holding the link
- The README
- Any test or doc naming the link (the About spec, statistics or the PRD)

**Acceptance criteria:**
- [x] A search of the repository finds no "buymeacoffee" outside issue 146, this issue, the inbox and .out-of-scope
- [x] About shows the share-or-star line with the repository's link; the README too
- [ ] The About spec covers it; every test passes in Linux's fonts too (covered, and it passes in Chromium on the Mac; Linux's fonts are GitHub's run)

**Out of scope:**
- Any other way of receiving money

## How it was built

- About's Support entry now reads "Enjoying Limpide? Share it, or star it on GitHub", "star it on GitHub" linking to the repository; the `COFFEE` address is gone. The entry keeps its "Support" label: Claude's call, open to the owner.
- The README's line under "Play it in your browser" reads "Enjoying it? Share it, or ⭐ the repository.", "⭐ the repository" the link; the ☕ went with the coffee.
- The About spec checks the line, its link, and that no coffee link is left. The short phone's test (the way in on the first screen, 393 × 659) still passes with the longer line.
- A search finds "buymeacoffee" only in issue 146, this issue, the inbox, .out-of-scope, and `docs/reviews/2026-10-31/13-fact-checker.md`, a dated review's record of what it checked that day, left as written: Claude's call, open to the owner.

**To try:** open About (the logo or ⓘ): the Support entry's line and its link to the repository; on a phone's width, the Demo and the Tour still on the first screen. The README on GitHub shows its line once pushed.
