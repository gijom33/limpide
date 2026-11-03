# 208: What the tests miss

**What to build:** The owner's question (2026-11-02), how to be confident the test suite is sufficient, and the owner's yes to Claude's proposal: "Sure. Also wondering if the stats I generate overlaps a bit since it reports coverage." It does, in part: the statistics ([84](./84-project-statistics.md)) already give the unit and engine tests' coverage as a whole (63.4 % of lines and 57.3 % of branches at 1.21.1, the end-to-end tests not counted). What they do not say is where the gaps are, nor whether the tests that run a line would catch it going wrong.

**Blocked by:** [131](./131-v1.md) (v1 first, by the scope rule)

**Status:** needs-triage · enhancement. v2, not committed (Claude's call, open to the owner: tooling, beyond v1's polish by the scope rule; the owner may move it into v1).

## What a grilling would settle

1. **Coverage by file:** the statistics' run already makes the report; whether to keep a short list of the least covered files beside the totals, and which of them matter (the engine and the Grids before the UI's glue).
2. **The bugs that got through:** for each bug the owner finds, a line saying whether a test should have caught it and which kind (unit, engine, end-to-end), so that over a few weeks the thin places show.
3. **Mutation testing** (Stryker or the like) on the engine and the Grids only, since it is slow: the share of small code changes no test catches, as the honest measure coverage is not. Whether it earns its run time, judged after 1.
4. **The end-to-end tests' coverage:** whether to count it too, as the statistics' number leaves it out.
