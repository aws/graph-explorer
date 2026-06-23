# Documentation

How to write user-facing docs (READMEs, guides, the docs site). For agent-facing convention docs, match the terse style of the files in this folder instead.

- Professional, clear, accessible to technical and non-technical readers
- Concise — get to the point; no filler
- Write from the reader's perspective: their goal, their pain point
- State prerequisites up front — what the reader needs before starting
- kebab-case file names (`getting-started.md`)
- No emojis

## Pitch to the audience

- **End users (analysts, researchers)**: business value and use cases, step-by-step tutorials with screenshots, minimal jargon, troubleshooting for common mistakes
- **Administrators**: deployment/configuration, security, performance tuning, monitoring and maintenance
- **Developers/contributors**: architecture, dev setup, contribution guidelines, API references

## GitHub alerts

Use for notices and warnings. The marker goes on its own line, followed by the message on the next blockquote line:

```
> [!CAUTION]
> Message goes here
```

Available markers:

- `[!NOTE]` — good to know while skimming
- `[!TIP]` — do it better or more easily
- `[!IMPORTANT]` — key to the reader's goal
- `[!WARNING]` — urgent; avoids a problem
- `[!CAUTION]` — risk of a bad outcome
