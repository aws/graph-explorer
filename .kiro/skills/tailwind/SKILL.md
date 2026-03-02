---
name: tailwind
description:
  Tailwind CSS v4 styling rules, responsive design patterns, and data attribute
  conventions for Graph Explorer.
tools:
  [
    "fs_read",
    "code",
    "read",
    "write",
    "grep",
    "glob",
    "web_search",
    "web_fetch",
  ]
---

- Use Tailwind v4 CSS syntax
- The `tailwind.config.ts` file remains for legacy reasons
- Prefer Tailwind responsive directives and container queries over
  `ResizeObserver` for responsive layout changes whenever possible
- Prefer using data attributes to deal within conditionally applied styles using
  Tailwind
- Lookup the latest Tailwind documentation from `https://tailwindcss.com/docs`
