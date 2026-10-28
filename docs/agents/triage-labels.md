# Triage labels

The skills speak of five triage states and two categories. Here they are words at the start of an issue's Status line (`**Status:** ready-for-agent · bug`), not GitHub labels; see [`issue-tracker.md`](./issue-tracker.md).

| Role in the skills | In our Status line | Meaning |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | The owner has to look at it. The inbox is this queue for lines not yet issues. |
| `needs-info` | `needs-info` | Waiting on someone (the owner, a visitor) for a fact. |
| `ready-for-agent` | `ready-for-agent` | Fully specified, with an Agent Brief: a fresh session can build it with `/implement`. |
| `ready-for-human` | `ready-for-human` | Only the owner can do it: try it on the real C16 or a phone, listen, judge taste, post. |
| `wontfix` | `wontfix` | Will not be done; a rejected feature also gets a file in `.out-of-scope/`. |
| `bug` | `bug` | Something is broken. |
| `enhancement` | `enhancement` | A new feature or an improvement. |

Every open issue carries exactly one state and one category. A finished issue's Status starts `done`, `closed` or `superseded` instead; issue 25 (the release log) is `ongoing`.
