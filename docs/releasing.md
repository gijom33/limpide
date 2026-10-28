# Releasing

How a version of Limpide is published. A release starts only on the owner's own "push" or "release" ([CLAUDE.md](../CLAUDE.md)). Each release is a push, in this order; a version is published only once it is live:

1. **Minor releases** (new visible features) first get a code review: the code-review skill over everything since the last minor tag. Fix the bugs it finds; send the rest to the inbox.
2. The full suite green.
3. The version: patch by default, minor for new visible features, major only on the owner's word (`npm version X.Y.Z --no-git-tag-version`), and its line in `docs/issues/25-releases.md`.
4. Commit it as `Issue 25: version X.Y.Z` (issue 25 is the release log) and `git push origin main`: a push to `main` deploys the site.
5. When the deploy run is green: an annotated tag `vX.Y.Z` on that commit, `git push origin vX.Y.Z`, and `gh release create` with the version's release-log line as its notes. Done.
6. If the deploy fails, fix it and push again under the same version (its release-log line says what the fix added): a failed attempt costs no version number. A re-run of the same commit needs no push.
