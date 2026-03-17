---
name: github
description: Handle management of any GitHub related tasks, including creating or modifying issues, publishing a branch as a pull requests (or PRs), or creating or modifying sub-issues or child issues.
tools: ["git", "gh", "fs_read", "grep", "glob", "web_search", "web_fetch"]
---

# GitHub Project Management

## General

- Use the `gh` CLI for all GitHub operations when possible
- Never delete or change the status of issues or pull requests unless explicitly requested
- Never mention CVEs, security vulnerabilities, or security advisories in issues or PRs. Instead, describe the change as a dependency update (e.g., "Update fast-xml-parser to latest version" rather than "Fix CVE-2026-25896")

## Issues

- Always assign an issue type when creating issues: `Bug`, `Feature`, `Epic`, `Task`, or `Spike`
- Use the corresponding issue template for each type:
  - `Bug` → `.github/ISSUE_TEMPLATE/01-bug-report.md`
  - `Feature` → `.github/ISSUE_TEMPLATE/02-feature-request.md`
  - `Epic` → `.github/ISSUE_TEMPLATE/03-epic.md`
  - `Task` → `.github/ISSUE_TEMPLATE/04-task.md`
  - `Spike` → `.github/ISSUE_TEMPLATE/05-spike.md`
- Use context from the codebase or the web to fill in additional detail when creating issues
- Only apply labels from the existing set; do not create new labels
- Do not add or remove labels unless explicitly requested
- For tasks and spikes, always assign a parent issue with the type bug, feature, or epic

## Sub-Issues

Create a sub-issue (child) under a parent issue:

```bash
PARENT_ID=$(gh issue view <parent-number> --json id --jq '.id')
CHILD_ID=$(gh issue view <child-number> --json id --jq '.id')
gh api graphql \
  -H "GraphQL-Features: sub_issues" \
  -f query="mutation { addSubIssue(input: { issueId: \"$PARENT_ID\", subIssueId: \"$CHILD_ID\" }) { issue { title } subIssue { title } } }"
```

Note: `gh issue create` does not support `--parent`. Create the issue first, then link it via the GraphQL API as shown above.

## Related Issues

When an issue or PR relates to another issue or PR, add a "Related Issues" section with a list of linked items. Always use a list format, even for a single item, because GitHub expands the reference number into the referenced item's title (e.g., `- Fixes #123` renders as "Fixes some bug #123").

Prefix each item with a brief relationship descriptor such as:

- `Fixes` or `Resolves` — closes the referenced issue
- `Part of` — contributes to a larger effort
- `Parent` — the parent issue or epic
- `Duplicate` — duplicates another issue
- Other brief descriptors as appropriate

Example:

```markdown
## Related Issues

- Resolves #123
- Part of #456
```

## Pull Requests

- Always publish pull requests as drafts
- Always setup tracking when publishing a branch to a remote
- In the title, describe the changes conceptually (e.g., "Add vertex filtering to graph view")
- In the title, do not use conventional commit prefixes like `docs:`, `feature:`, `refactor:`, `fix:`, etc
- Follow the pull request template in `.github/pull_request_template.md`
- Link to the corresponding issue when one exists (e.g., `Fixes #123`)
- Keep descriptions concise and focused
- Include a bulleted list of changes at the conceptual level with reasons for each change so reviewers can scan quickly
- When filling out the PR template checklist, only check an item if the action was actually performed during the current session. For example, only check `pnpm checks` or `pnpm test` if those commands were run and passed. Leave items unchecked when unsure.
