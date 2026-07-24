# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations. Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

- Never delete an issue or PR, or change its status, unless explicitly requested
- Never mention CVEs, security vulnerabilities, or advisories in issues or PRs. Describe the change as a dependency update (e.g. "Update fast-xml-parser to latest version", not "Fix CVE-2026-25896").

## Issue commands

- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with `--label` / `--state` filters as needed
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
- **Create**: see [Creating issues](#creating-issues) — a real issue needs `--type`, often `--parent`, and sometimes dependency flags

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the relevant ticket", run `gh issue view <number> --comments`.

## Creating issues

- Assign the issue type, parent, and any dependencies in the single create command (requires `gh` 2.94.0+):

  ```bash
  gh issue create --title "..." --body "..." --label "..." --type "<type>" \
    --parent <parent-number-or-url> \
    --blocked-by <numbers> --blocking <numbers>
  ```

  `--type` is one of `Bug`, `Feature`, `Epic`, `Task`, or `Spike`. `--parent` links the issue as a sub-issue. `--blocked-by`/`--blocking` mark dependencies (comma-separated numbers or URLs). Omit any flag you don't need.

- The issue type is set with `--type`, never as a label.
- Use the matching template in `.github/ISSUE_TEMPLATE/`: Bug → `01-bug-report.md`, Feature → `02-feature-request.md`, Epic → `03-epic.md`, Task → `04-task.md`, Spike → `05-spike.md`
- Fill in detail from the codebase or web when creating issues
- A `Task` or `Spike` generally has a parent issue typed `Bug`, `Feature`, or `Epic` — pass it with `--parent`
- Only apply labels from the existing set; never create new labels, and don't add or remove labels unless explicitly requested
- Audience labels (internal vs. community) and their footers: see `docs/agents/issue-audience.md`

To change these on an existing issue, use `gh issue edit <number>` — note the flag names differ from create: `--parent <n>` / `--remove-parent`, `--add-blocked-by <n>` / `--remove-blocked-by <n>`, `--add-blocking <n>` / `--remove-blocking <n>`, and `--add-sub-issue <n>` / `--remove-sub-issue <n>`.

## Planning vocabulary

Terms for the pre-build planning hierarchy on the project board. All map onto the native GitHub issue types above.

**Initiative**:
A body of work too big for one release, expressing a vision (e.g. overhauling the style system). Always typed **Epic**. It is a never-tracked container — the board tracks its children, not the initiative itself — and it parents the features and epics that eventually deliver the vision. Sits below a Roadmap Item in scope and _may_ be flagged as one, but never requires it.
_Avoid_: Roadmap item (higher-level), theme

**Kickoff**:
The first child issue under an Initiative — the trackable spike whose job is to scope the still-vague initiative. Always typed **Spike**, parented to its Initiative, and labelled `wayfinder:kickoff`. It _contains_ a [Wayfinder](#wayfinder) session: running Wayfinder charts the map on this same issue, so it also carries `wayfinder:map`, and the kickoff is done once the Wayfinder route is clear. Its deliverable is the scoping; completing it turns a vague Initiative into planned work (features and epics as further children, siblings to the kickoff).
_Avoid_: Spark, prospect, stub, discovery

**Wayfinder**:
The `/wayfinder` skill (`~/.claude/skills/wayfinder`) — plans a chunk of work too big for one agent session as a shared map of investigation tickets on the issue tracker, resolved one at a time until the route to the destination is clear. Runs inside a Kickoff; the Kickoff issue _is_ the `wayfinder:map`.

## Pull requests

- Always publish as a draft, and set up remote tracking when publishing a branch
- Title describes the change conceptually (e.g. "Add vertex filtering to graph view"); no conventional-commit prefixes (`docs:`, `fix:`, etc.)
- Follow `.github/pull_request_template.md`; link the issue when one exists (e.g. `Fixes #123`)
- Keep the description concise: a bulleted list of conceptual changes with the reason for each so reviewers can scan
- Only check a template checklist item if that action was actually performed this session (e.g. only check `pnpm checks`/`pnpm test` if you ran them and they passed); leave unchecked when unsure

## Pull requests as a triage surface

**PRs as a request surface: yes.** `/triage` pulls external PRs into the same queue as issues and runs them through the same labels and states, using the `gh pr` equivalents (collaborators' in-flight PRs are left alone):

- **Read a PR**: `gh pr view <number> --comments`, plus `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## Related issues

Both issues and PRs can carry a `## Related Issues` section in their body — a list (always a list, even for one item; GitHub expands each reference into the linked item's title). Prefix each entry with a relationship descriptor:

- An **issue** links to other issues: `Part of` (larger effort), `Parent`, `Duplicate`, `Blocked by`/`Blocking`, or another brief one.
- A **PR** links to its originating issue with `Fixes`/`Resolves` (closes it on merge), and to any other related issues or PRs with the same descriptors.

**Parent** and **blocked-by/blocking** are native GitHub fields — set them with the `gh` flags (see [Creating issues](#creating-issues)), not prose alone. Listing them here as well is fine, but the relationship must exist as the structural field, never only in prose.

```markdown
## Related Issues

- Resolves #123
- Part of #456
```
