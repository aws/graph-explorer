---
inclusion: always
---

# Project Management

## General

- Use the `gh` CLI for all GitHub operations when possible
- Never delete or change the status of issues or pull requests unless explicitly
  requested

## Issues

- Always assign an issue type when creating issues: `Task`, `Bug`, `Feature`,
  `Epic`, or `Spike`
- Use context from the codebase or the web to fill in additional detail when
  creating issues
- Only apply labels from the existing set; do not create new labels
- Do not add or remove labels unless explicitly requested

## Sub-Issues

Create a sub-issue (child) under a parent issue:

```bash
PARENT_ID=$(gh issue view <parent-number> --json id --jq '.id')
CHILD_ID=$(gh issue view <child-number> --json id --jq '.id')
gh api graphql \
  -H "GraphQL-Features: sub_issues" \
  -f query="mutation { addSubIssue(input: { issueId: \"$PARENT_ID\", subIssueId: \"$CHILD_ID\" }) { issue { title } subIssue { title } } }"
```

Note: `gh issue create` does not support `--parent`. Create the issue first,
then link it via the GraphQL API as shown above.

## Related Issues

When an issue or PR relates to another issue or PR, add a "Related Issues"
section with a list of linked items. Always use a list format, even for a single
item, because GitHub expands the reference number into the referenced item's
title (e.g., `- Fixes #123` renders as "Fixes some bug #123").

Prefix each item with a brief relationship descriptor such as:

- `Fixes` or `Resolves` — closes the referenced issue
- `Part of` — contributes to a larger effort
- `Parent` — the parent issue or epic
- `Duplicate` — duplicates another issue
- Other brief descriptors as appropriate

Example:

```markdown
## Related Issues

- Fixes #123
- Part of #456
```

## Pull Requests

- Always publish pull requests as drafts
- Follow the pull request template in `.github/pull_request_template.md`
- Link to the corresponding issue when one exists (e.g., `Fixes #123`)
- Keep descriptions concise
- Include a bulleted list of changes at the conceptual level with reasons for
  each change so reviewers can scan quickly
