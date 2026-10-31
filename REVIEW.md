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
- **Runtime APIs newer than the browser floor in `packages/graph-explorer/.browserslistrc`,** such as `Error.isError` or Iterator helpers. The type check and oxlint catch most of these. Check by hand for what they miss, listed in `docs/agents/browser-floor.md`: DOM instance members, and built-in features that `lib` allows but the floor doesn't.
- **Production code that imports a `devDependency`.**
- **Work that grows with graph or schema size:** one query or subscription per item, quadratic loops, or copying passes over large collections.
- **Tests that can't fail.** Name a plausible regression of the behavior the test's name promises, and prove the verdict with a mutation: inject that regression and run the test. A test that stays green is the finding, and the fix is to tighten it until the mutation turns it red. Recommend deletion only when no regression of that behavior could reach the test. Flag these:
  - Assertions on plumbing the test set up itself.
  - Tests that lock in a bug.
  - Tests deleted without a stated reason.
- **Untrusted input read without a Zod parse,** or a Zod `.catch()` that quietly turns bad input into a different valid value.
- **Docs that contradict the code, or each other,** after this change. A documented route, header, environment variable default, or limit that no longer matches the source is Important, and so is a page that tells the reader to do something another page says the platform already does.
- **Hosting examples outside the supported model.** The model is defined in `docs/references/security.md#supported-hosting`. Flag a doc, sample, or script that serves plain HTTP other machines can reach, such as `PROXY_SERVER_HTTPS_CONNECTION=false` with the port published on every interface and no reverse proxy that terminates TLS in front of it. Also flag an example that other machines can reach and that says nothing about the access control limiting who reaches it.
- **Public text that discloses.** The PR adds reproduction steps for a security-relevant issue, advisory IDs, or customer data to code, docs, or the PR description.
- **Security changes that widen a documented risk or break a guarantee.** The [Security model](#security-model) section defines both.

## Security model

`docs/references/security.md` defines the threat model: supported deployments, what the deployer owns, and what the proxy server guarantees. Test and judge security findings against it.

- Only what the doc explicitly assigns to the deployer is by design: who can reach the deployment, what authenticates in front of it, and what the database's own permissions allow. Don't report those. Anything else the proxy server does is Graph Explorer's to get right, including the settings Graph Explorer's images and sample scripts choose for a managed platform.
- Each "never", "does not", or "refuses" statement in the doc is a guarantee. A change that breaks one, or widens a documented risk, is Important.
- A default the doc marks as an accepted risk is not a guarantee. Raise one as a Nit, naming the control the doc offers, when the change touches or relies on that default. A change that widens it is Important.
- Graph Explorer owns untrusted input: database data, imported files, and connection links.

## Verification bar

- Every Important finding names the file:line, the input that triggers it, and a real caller that reaches it. If you can't trace all three, post it as a Nit or drop it. A broken guarantee names the doc statement it breaks in place of the input.
- Say when a claim comes from reading the code rather than from a test or a run.
- Treat claims about third-party tools, package versions, or browser behavior as unverified unless you checked their source or docs. Say which it is.
- Before flagging a design choice, check `docs/adr/`. Don't flag a choice an ADR already made.

## Do not report

- Anything CI enforces: `vp lint` (oxlint, including the React Compiler rules), `vp fmt` (oxfmt), the type check in `vp check`, lockfile checks, Trivy and dependency advisories.
- Pre-existing issues, unless this PR makes them newly reachable.
- The Git rules in `AGENTS.md`. PRs are squash merged, so commit messages, branch names, and how the commits are split never reach `main`.
- `Changelog.md`. It's updated at release time.
- Memoization or re-render advice. The React Compiler handles this unless it bails out on that component.
- Security behavior the [Security model](#security-model) section assigns to the deployer. Accepted defaults aren't covered by this exclusion.
- Missing ADRs, missing glossary entries, or missing tests for components that only render UI.
- Files under `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`, plus `skills-lock.json` and `THIRD_PARTY_LICENSES.txt`.
- In `pnpm-lock.yaml`, report only churn that's unrelated to the PR.

## Writing comments

These rules govern the comments you write. They are not a standard for the prose you are reviewing.

This repo is public. Describe a security-relevant issue by its fix, never by how to trigger it. Don't include CVE or advisory IDs, customer details, or employer-internal links, tool names, or ticket IDs.

- Keep each comment to one or two sentences, with no pleasantries.
- Use a suggestion block when the fix is a few lines.
- Post at most five Nits. Group repeats of one pattern into a single comment that lists the locations, and give the rest as a count in the summary.
- After the first review, post only Important findings, and don't re-raise resolved threads.
- Open the summary with a tally, like `1 Important, 3 Nit`, or with `No blocking issues.`
