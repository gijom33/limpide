# Releasing

How a version of Limpide is published. A release starts only on the owner's own "push" or "release" ([CLAUDE.md](../CLAUDE.md)). Each release is a push, in this order; a version is published only once it is live:

1. `git fetch`, and if `main` is behind `origin/main`, replay it on top (`git rebase origin/main`, dropping any commit GitHub already has under another hash), so the suite below tests what ships. Another session may have pushed meanwhile.
2. **A release that carries issue work** (a feature, a fix, a refactor that changes nothing visible) first gets a code review: the code-review skill over everything since the last tag. Fix the bugs it finds; send the rest to the inbox.
3. `npx tsc`, `npm run lint` and `npx vitest run` green, and the Playwright specs the release's changes touch; the deploy run runs all of Playwright, in parallel jobs, and deploys only when every one is green ([ADR-0015](adr/0015-ci-runs-the-end-to-end-tests-before-a-deploy.md)).
4. The version: patch by default, minor for new visible features, major only on the owner's word (`npm version X.Y.Z --no-git-tag-version`), and its line in `docs/issues/25-releases.md`.
5. Commit it as `Issue 25: version X.Y.Z` (issue 25 is the release log) and `git push origin main`: a push to `main` deploys the site.
6. When the deploy run is green (about 6 minutes): an annotated tag `vX.Y.Z` on that commit, `git push origin vX.Y.Z`, and `gh release create` with the version's release-log line as its notes.
7. The statistics, after the push: `npm run stats` measures the release's size, quality and performance and writes its row into [statistics.md](statistics.md) and the README's summary (issue 84). It runs the whole suite again, with coverage, then the page load and the running app, in about an hour: on a quiet machine, with no other session's tests running, since the timings count. It ends with an error if a test, the types or the lint failed. Its row is committed, and goes out with the next push.
8. If the deploy fails, fix it and push again under the same version (its release-log line says what the fix added): a failed attempt costs no version number. A re-run of the same commit needs no push.
