# The digest

1. **Since when:** the date of the newest `*-digest.md` in `docs/outreach/drafts/`, or 14 days ago.
2. **Search every source** below for Limpide since then. "Limpide" is also a French word, so keep only what is about this synth: a link to `gijom33.github.io/limpide` or `github.com/gijom33/limpide`, or talk of a browser synth. Done when every source has its results, "nothing", or "failed:" and why.

   | Source | How |
   | --- | --- |
   | The owner's threads | each URL in `places.md`'s Our thread column: WebFetch it (a Reddit thread as `<url>.json`); the new replies |
   | Reddit | WebSearch `"Limpide" synth site:reddit.com`, and `https://www.reddit.com/search.json?q=limpide&sort=new` |
   | Elektronauts, lines | `https://forum.elektronauts.com/search.json?q=limpide`, `https://llllllll.co/search.json?q=limpide` |
   | KVR, Gearspace | WebSearch `"Limpide" site:kvraudio.com`, `"Limpide" site:gearspace.com` |
   | Hacker News | `https://hn.algolia.com/api/v1/search_by_date?query=limpide` |
   | YouTube, blogs | WebSearch `"Limpide" synth` |
   | GitHub | `gh issue list --state all`, `gh api repos/gijom33/limpide/traffic/views`, `gh api repos/gijom33/limpide/traffic/popular/referrers`, `gh repo view --json stargazerCount,forkCount` |

3. **Each mention:** where, who, when, the link, what was said in one line (a quote under 15 words at most). Mark each that asks a question, reports a bug, or criticises.
4. **A reply for each marked one,** short, in the developer's voice, answering what was asked; for a bug, where to report it (GitHub Issues). The owner rewrites it before posting.
5. **The numbers:** stars, forks, the last 14 days' views and the top referrers, and each one's change since the last digest.
6. **What to build from it:** a request or bug worth an issue, as a suggested inbox line in the person's words with the link. The owner decides whether it goes in the inbox.
