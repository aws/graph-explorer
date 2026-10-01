# Review instructions

In this repo the costliest mistakes are breaking data that users have already saved or exported, and sending a query their database can't run.

## What Important means here

Reserve Important for the cases below. Everything else is Nit at most. That includes the structure and style rules in `AGENTS.md`, even though it calls structural quality a hard requirement.

- **Saved or exported data breaks.** If a change touches a persisted atom, an export file format (connections, styling, graph), the default connection payload, or an environment variable, the new build must still read old values. Files this build writes must stay readable by older releases. Flag a shape change that lacks the backward-compatibility tests `docs/agents/testing.md` requires. Also flag any edit to a `__fixtures__` golden file or a backward-compatibility test that makes the test pass instead of fixing the code.
- **Queries the database can't run, or runs badly.**
  - Gremlin that needs a TinkerPop version newer than 3.6.2, or that can't run as an HTTP string query.
  - Values that reach a query outside a Query Fragment, or any other break of the rules in `docs/agents/connectors.md`.
  - A limit that doesn't bound the scan.
  - A change to one connector, or to shared query code, that changes behavior in the other query languages without saying why.
- **Runtime APIs newer than Baseline Widely available,** such as `Error.isError` or Iterator helpers. `tsc` uses `lib: ESNext`, so it won't catch these. Also flag production code that imports a `devDependency`.
- **Work that grows with graph or schema size:** one query or subscription per item, quadratic loops, or copying passes over large collections.
- **Tests that can't fail.** Ask whether the test would fail if the change were reverted. Flag these:
  - Assertions on plumbing the test set up itself.
  - Tests that lock in a bug.
  - Tests deleted without a stated reason.
- **Untrusted input read without a Zod parse,** or a Zod `.catch()` that quietly turns bad input into a different valid value.
- **Docs, ADRs, or `CONTEXT.md` that contradict the code** after this change.
- **Public text that discloses.** The PR adds reproduction steps for a security-relevant issue, advisory IDs, or customer data to code, docs, or the PR description.

## Verification bar

- Every Important finding names the file:line, the input that triggers it, and a real caller that reaches it. If you can't trace all three, post it as a Nit or drop it.
- Say when a claim comes from reading the code rather than from a test or a run.
- Treat claims about third-party tools, package versions, or browser behavior as unverified unless you checked their source or docs. Say which it is.
- Before flagging a design choice, check `docs/adr/`. Don't flag a choice an ADR already made.

## Do not report

- Anything CI enforces: `vp lint` (oxlint, including the React Compiler rules), `vp fmt` (oxfmt), `tsc`, lockfile checks, Trivy and dependency advisories.
- Pre-existing issues, unless this PR makes them newly reachable.
- The Git rules in `AGENTS.md`. PRs are squash merged, so commit messages, branch names, and how the commits are split never reach `main`.
- `Changelog.md`. It's updated at release time.
- Memoization or re-render advice. The React Compiler handles this unless it bails out on that component.
- Security behavior that's by design:
  - Graph Explorer has no built-in auth.
  - The proxy forwards to any database URL unless the optional allowlist is set.
  - The proxy passes database error responses through.
- Missing ADRs, missing glossary entries, or missing tests for components that only render UI.
- Files under `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`, plus `skills-lock.json` and `THIRD_PARTY_LICENSES.txt`.
- In `pnpm-lock.yaml`, report only churn that's unrelated to the PR.

## Writing comments

This repo is public. Describe a security-relevant issue by its fix, never by how to trigger it. Don't include CVE or advisory IDs, customer details, or employer-internal links, tool names, or ticket IDs.

- Keep each comment to one or two sentences, with no pleasantries.
- Use a suggestion block when the fix is a few lines.
- Post at most five Nits. Group repeats of one pattern into a single comment that lists the locations, and give the rest as a count in the summary.
- After the first review, post only Important findings, and don't re-raise resolved threads.
- Open the summary with a tally, like `1 Important, 3 Nit`, or with `No blocking issues.`
