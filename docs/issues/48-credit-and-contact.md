# 48: Say who built it, and how

**What to build:** Three reviewers asked the same: who did what, and how do I reach the author? Nothing a visitor reaches says Limpide was built with Claude Code, or what the owner's part was; the only trace is the co-author trailer on every commit ([review 4](../reviews/2026-10-26/4-ai-expert.md), [review 7](../reviews/2026-10-26/7-recruiter.md)). "Made by Guillaume Boillet" in About is plain text, the GitHub profile has no name, bio or link, and the README, the page a LinkedIn visitor lands on from the repository, opens with jargon and no picture. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26), but for the owner's GitHub profile. **Before the LinkedIn post:** yes (the post is about the build as much as the synth)

- [x] About: one honest line on how it was built (designed and directed by the owner, code written with Claude Code), and the owner's name linked to LinkedIn or a site. Wording decided by the owner (2026-10-26): "Designed and directed by Guillaume Boillet; code written with Claude Code, Anthropic’s AI coding agent.", the name linked to the owner's LinkedIn
- [x] README: a screenshot or short GIF under the tagline, and one plain-words line before the feature list ("turn a knob and watch what it does to the sound"). Done: `docs/screenshot.png` (the Demo playing Acid, 1440 × 900), linked to the site; "Every picture on the page moves with the sound you hear" under it
- [x] README: a "How this was built" section: the PRD, issues, ADRs and inbox, Claude Code and the AI Hero skills, what the owner decided and what the agent did, with links into `docs/`
- [x] The README's claim that every push is tested made true (issue 54)
- [ ] The owner's GitHub profile: name, bio, link (the owner's to do)
