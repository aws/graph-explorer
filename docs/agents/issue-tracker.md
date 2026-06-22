# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations. Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

- Never delete an issue or PR, or change its status, unless explicitly requested
- Never mention CVEs, security vulnerabilities, or advisories in issues or PRs. Describe the change as a dependency update (e.g. "Update fast-xml-parser to latest version", not "Fix CVE-2026-25896").

## Commands

- **Create**: `gh issue create --title "..." --body "..."` (heredoc for multi-line bodies)
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with `--label` / `--state` filters as needed
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the relevant ticket", run `gh issue view <number> --comments`.

## Issues

- Assign an issue type on creation: `Bug`, `Feature`, `Epic`, `Task`, or `Spike`. Set it via REST after creation: `gh api -X PATCH repos/{owner}/{repo}/issues/{number} --field type={type_name}`
- Use the matching template in `.github/ISSUE_TEMPLATE/`: Bug → `01-bug-report.md`, Feature → `02-feature-request.md`, Epic → `03-epic.md`, Task → `04-task.md`, Spike → `05-spike.md`
- Fill in detail from the codebase or web when creating issues
- A `Task` or `Spike` must have a parent issue typed `Bug`, `Feature`, or `Epic`
- Only apply labels from the existing set; never create new labels, and don't add or remove labels unless explicitly requested
- Audience labels (internal vs. community) and their footers: see `docs/agents/issue-audience.md`

## Sub-issues

`gh issue create` has no `--parent`. Create the child first, then link via GraphQL:

```bash
PARENT_ID=$(gh issue view <parent-number> --json id --jq '.id')
CHILD_ID=$(gh issue view <child-number> --json id --jq '.id')
gh api graphql \
  -H "GraphQL-Features: sub_issues" \
  -f query="mutation { addSubIssue(input: { issueId: \"$PARENT_ID\", subIssueId: \"$CHILD_ID\" }) { issue { title } subIssue { title } } }"
```

## Related issues

When an issue or PR relates to another, add a `## Related Issues` section as a list (always a list, even for one item — GitHub expands the reference into the item's title). Prefix each with a relationship descriptor: `Fixes`/`Resolves` (closes it), `Part of` (larger effort), `Parent`, `Duplicate`, or another brief one.

```markdown
## Related Issues

- Resolves #123
- Part of #456
```

## Pull requests

- Always publish as a draft, and set up remote tracking when publishing a branch
- Title describes the change conceptually (e.g. "Add vertex filtering to graph view"); no conventional-commit prefixes (`docs:`, `fix:`, etc.)
- Follow `.github/pull_request_template.md`; link the issue when one exists (e.g. `Fixes #123`)
- Keep the description concise: a bulleted list of conceptual changes with the reason for each so reviewers can scan
- Only check a template checklist item if that action was actually performed this session (e.g. only check `pnpm checks`/`pnpm test` if you ran them and they passed); leave unchecked when unsure
