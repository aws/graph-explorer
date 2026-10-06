---
name: issue
description: Create GitHub issues with repo conventions, issue templates, audience control (internal/community), and issue type assignment. Also switches existing issues between internal and community. Use when user says "create an issue", "file a bug", "open an issue", "make this community", "switch issue to internal", or wants to create or manage issues.
---

# issue

Create issues or switch the audience of existing issues, respecting repo conventions.

## Prerequisites

- `gh` CLI installed and authenticated. If missing, stop and tell the user.

## Modes

Detect mode from user input:

- **Create** — no existing issue number referenced. Default mode.
- **Switch** — an existing issue number is referenced with an audience change intent (e.g., "make #42 community", "switch #42 to internal").

---

## Create Mode

### 1. Read repo conventions

Read these files in order, skipping any that don't exist:

1. **`docs/agents/issue-tracker.md`** — determines which tracker and CLI to use. If missing, assume GitHub + `gh`.
2. **`docs/agents/issue-audience.md`** — audience labels and footers. If missing, offer to set it up (see [Setup Flow](#setup-flow)).
3. **`docs/agents/triage-labels.md`** — triage label vocabulary. If missing, skip triage labels entirely.
4. **`GLOSSARY.md`** — domain glossary for terminology. Use canonical terms in issue title and body.
5. **`.github/ISSUE_TEMPLATE/`** — parse frontmatter `type:` field from each template to determine available issue types. If no templates exist, fall back to: Bug, Feature, Task.

### 2. Gather context

If conversation context exists (e.g., from a prior /grill-with-docs, /triage, or discussion), draft the issue from that context. Otherwise, ask the user to describe the issue.

### 3. Explore the codebase

Scale exploration depth to the issue type:

- **Task** — minimal. Skim relevant files to confirm terminology and add a sentence of context.
- **Bug / Spike** — moderate. Trace the relevant code path, check recent git history in the area, note related files or modules.
- **Feature / Epic** — light touch only. These are expected to go through /to-prd and /grill-with-docs for full scoping. Add enough context to orient a reader, not to scope the work.

Use findings to enrich the issue body with technical context the user didn't provide. Use domain glossary terms from `GLOSSARY.md`.

### 4. Determine issue type

If the type is obvious from context, confirm it with the user. Otherwise, present the available types (derived from templates) and ask.

**Important:** The issue type (Bug, Feature, Task, etc.) is NOT a label. It is set at creation time with `gh issue create --type <name>` (see step 11). Do not add the issue type as a label. When the user says "create a bug issue" or "file a bug", interpret "bug" as the issue type, not a label to apply.

### 5. Check available labels

Fetch the repo's label list:
```bash
gh label list --limit 100
```

Select labels that are relevant to the issue based on the content, area of code, or category. Do NOT apply the issue type as a label (see step 4). Only apply labels that actually exist in the repo.

### 6. Search for related issues

Search open issues that might be related:
```bash
gh issue list --state open --search "<relevant keywords>"
```

If related issues exist, mention them in the draft body under a "Related Issues" section (e.g., `Related: #123, #456`). If a duplicate is found, flag it to the user before drafting.

### 7. Ask about audience

Always ask explicitly:

> Is this issue internal (core team only) or open for community contribution? (default: internal)

Never assume. Apply the label and footer from `docs/agents/issue-audience.md` based on the answer.

### 8. Ask about parent issue

If the user mentioned a parent issue, link it. Do NOT prompt for a parent — only pick it up if volunteered.

### 9. Draft the issue

Compose the issue using the corresponding issue template (if one exists for the chosen type). Fill in template sections from gathered context. Add:

- The correct audience footer, wrapped in `<audience-footer>` tags. GitHub does not render unknown HTML elements, so they act as invisible markers:
  ```
  <audience-footer>

  > [!IMPORTANT]
  > Footer text here.

  </audience-footer>
  ```

**Redaction rules** — never include in title or body:
- Security vulnerabilities, CVEs, CWEs, or attack vectors
- Secrets, API keys, tokens
- PII

If an `issue-internal` skill is available, invoke it now, before the preview in step 10, so the draft the user reviews has already been screened.

### 10. Preview and confirm

Show the user the full draft:
- Title
- Type
- Labels (audience + triage if applicable)
- Parent issue (if any)
- Body (rendered)

Wait for explicit approval. If the user requests edits, apply them and re-preview.

### 11. Publish

Create the issue in one command, setting the type, parent, and any dependencies as flags (requires `gh` 2.94.0+):

```bash
gh issue create --title "<title>" --body "<body>" --label "<labels>" --type "<type>" \
  --parent <parent-number-or-url> \
  --blocked-by <numbers> --blocking <numbers>
```

`--type` sets the issue type, `--parent` links it as a sub-issue, and `--blocked-by`/`--blocking` mark dependencies (comma-separated numbers or URLs). Omit any flag you don't need.

If the triage system is present and the issue type has a default triage state, apply the triage label.

Print the issue URL when done.

---

## Switch Mode

Switch an existing issue's audience between internal and community.

### 1. Read conventions

Read `docs/agents/issue-audience.md`. If missing, offer to set it up.

### 2. Determine current audience

Check the issue's labels for the internal label defined in `issue-audience.md`.

### 3. Confirm the switch

Tell the user the current audience and ask to confirm the target:
> Issue #42 is currently **internal**. Switch to **community**?

### 4. Update the footer

Replace the footer in the issue body using this priority:

1. **`<audience-footer>` tags** — if `<audience-footer>` and `</audience-footer>` exist, replace content between them.
2. **Legacy HTML comment markers** — if `<!-- audience-footer-start -->` and `<!-- audience-footer-end -->` exist, replace the entire block (including markers) with the new `<audience-footer>` format.
3. **Known footer text** — if the current footer text (from `issue-audience.md`) is found in the body, replace it and wrap with `<audience-footer>` tags.
4. **Append** — if neither is found, append the new footer wrapped in `<audience-footer>` tags.

### 5. Update labels

**Switching to internal:**
- Add the internal label
- Remove any signal labels defined in the community section of `issue-audience.md`

**Switching to community:**
- Remove the internal label
- Add the primary signal label defined in the community section of `issue-audience.md`

### 6. Apply changes

```bash
gh issue edit <number> --body "<updated body>" --add-label "<label>" --remove-label "<label>"
```

Print the issue URL when done.

---

## Setup Flow

When `docs/agents/issue-audience.md` is missing, offer to create it with these defaults:

```markdown
# Issue Audience

How issues in this repo are marked for internal team use vs. open community contribution.

## Internal

- **Label:** `internal`
- **Footer:**

  > [!IMPORTANT]
  > Internal only — this issue is maintained by the core team and is not accepting external contributions.

## Community

- **Signal labels:** `help-wanted`
- **Footer:**

  > [!IMPORTANT]
  > If you are interested in working on this issue, please leave a comment.

  > [!TIP]
  > Please use a 👍 reaction to provide a +1/vote. This helps the community and maintainers prioritize this request.
```

Present these defaults and ask: "Does this look right for your repo, or do you want to change any of the labels or footer text?"

Apply edits, then write the file and continue with the original task.
