# 146: A tip link in About

**What to build:** The owner's idea (inbox, 2026-10-31): "Add a link to buy me a coffee or something that sounds like this, it would be in the how about, and it would be a nice way to get some pocket money." A link in About (the credit and contact are there, issue [48](./48-credit-and-contact.md)) to a page where a visitor who enjoys Limpide can give a little.

**Blocked by:** none

**Status:** done (2026-10-31). "Support: Enjoying Limpide? Buy me a coffee" in About, under the credit, and a line in the README, both to https://buymeacoffee.com/gijom33.

## Questions for the owner

1. **v1 or v2?** Under v1's scope rule ([131](./131-v1.md), decision 12) a new idea goes to v2 unless it is a bug or polish of something in v1. Claude's recommendation: v1, as polish of About: one link, no feature.
2. **Which service?** Buy Me a Coffee, Ko-fi, GitHub Sponsors and Liberapay are the usual ones for open-source work; they differ in fees, payouts and what the visitor sees. Claude's recommendation: a `/research` pass on their current fees and terms before choosing, as they change; GitHub Sponsors would also put a Sponsor button on the repository.
3. **The words:** a line in About under the credit, in Limpide's voice ("Enjoying Limpide? Buy me a coffee."), and the same link in the README. Claude's recommendation: yes, one line each, never a pop-up or a nag.
4. **Opening the account** is the owner's step (Claude creates no account and enters no payment details); Claude adds the link once the owner gives its address.

## Decisions (2026-10-31)

1. **In v1,** as About's polish: the owner set the page up and gave its address the same day, to be linked. Decided by the owner.
2. **Buy Me a Coffee**, at https://buymeacoffee.com/gijom33; its About text, "Hi, I'm Guillaume…", drafted by Claude and chosen by the owner. Decided by the owner.
3. **The words:** a "Support" line in About right under the credit ("Enjoying Limpide? Buy me a coffee"), so it shows on a phone's first screen, and one line under the README's "Play it in your browser". Claude's call, open to the owner.

## How it was built

`src/ui/About.tsx` (the `COFFEE` address and the Support row), `README.md`, and a check of the link in `e2e/about.spec.ts`.
