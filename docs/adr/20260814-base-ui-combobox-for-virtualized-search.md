# ADR — Base UI + TanStack Virtual for the virtualized Combobox

- **Status:** Accepted
- **Date:** 2026-08-14
- **Related:** Issues #2086, #2087, #2089, #2090. Affects `components/Combobox.tsx` only.

## Context

Several pickers (node-type and attribute in the Search Sidebar, node-type in Data Explorer) render schema-derived option lists that scale with the number of vertex/edge types — into the thousands on large schemas. The existing `Select`/`SelectField` components wrap Radix's `Select` primitive, which renders every item into its own internal item-registration registry regardless of what's actually visible in the DOM. That registry, not just the visible DOM node count, is what scales with option count, so it can't be virtualized without abandoning Radix's `Select` entirely: at schema sizes in the thousands this locked up the UI.

Two alternatives were tried before landing on the current approach:

- **A fully hand-rolled combobox** was built first (see git history: the commit preceding this one shipped a hand-rolled implementation). It re-implemented accessible combobox semantics from scratch — ARIA roles, keyboard navigation, focus management, positioning — which is exactly the kind of well-tested, easy-to-get-subtly-wrong surface a primitives library exists to own. It was replaced rather than kept.
- **cmdk**, a virtualization-friendly command-palette library, was considered but doesn't provide the same breadth of accessible combobox wiring (positioning, focus management, ARIA) that Base UI ships, which would have meant hand-building some of the same surface the hand-rolled attempt already showed is easy to get wrong.

## Decision

`components/Combobox.tsx` wraps `@base-ui/react`'s `Combobox` primitives (accessible listbox/combobox semantics, ARIA wiring, positioning) with `@tanstack/react-virtual` for windowed rendering. This is deliberately scoped to **one file**: `Select`/`SelectField` and their Radix-based implementation are untouched, and remain the right choice for bounded, non-schema-sized option lists.

Both dependencies are added only to `packages/graph-explorer/package.json`, not the workspace root, since only this file imports them.

## Consequences

- **A second UI primitive stack now exists, scoped to one file.** An agent choosing between `Combobox` and `Select`/`SelectField` for a new picker should pick based on scale: `Combobox` for schema-sized/unbounded lists that need type-to-filter and virtualization, `Select`/`SelectField` for small bounded enums. Do not introduce a third primitive stack for the same class of problem — extend `Combobox` instead.
- **Base UI's attribute convention differs from Radix's.** Base UI emits bare boolean data attributes (`data-open`, `data-closed`, `data-starting-style`, `data-ending-style`), not Radix's `data-state="open"`/`"closed"`. The project's `data-open:`/`data-closed:` Tailwind shorthand is scoped to the Radix convention and will not match Base UI elements — see `docs/agents/design.md`.
- **`useVirtualizer` needs a React Compiler suppression.** The call in `Combobox.tsx` carries a `// eslint-disable-next-line react-compiler/incompatible-library` comment, since the compiler can't verify the hook's internal mutation patterns are safe to auto-memoize. See `docs/agents/react.md`.
- **The trigger/input interaction pattern is VoiceOver-validated, not just ARIA-linted.** The decorative arrow button is `aria-hidden` and click-only (not keyboard-focusable); the input itself gets an explicit `onClick` handler to open the list, because a text input has no native "click" default action the way a `<button>` does, and VoiceOver's Control-Option-Space gesture needs one to trigger reliably. A grouped, AX-visible trigger button reads to VoiceOver as "stop interacting with this group" rather than "open the list" — this was found and fixed via live VoiceOver testing on macOS across several rounds, not derived from an accessibility guideline. Changing this interaction pattern needs to be re-validated with a screen reader, not just re-derived from ARIA best practices.
- **Only visible options mount.** `VirtualizedOptions` renders ~20 DOM nodes regardless of total option count; the virtualizer must measure `Combobox.List` (the bounded, scrollable viewport), not the inner spacer div that's deliberately as tall as the full list — measuring the wrong element defeats virtualization silently (it "works" but renders nearly everything).

## Considered Options

- **Base UI + TanStack Virtual (chosen).** Accessible combobox semantics come from a maintained library; virtualization is a separate, composable concern. Cost: a second primitive stack, plus the attribute-convention and compiler-suppression divergences above.
- **Hand-rolled combobox.** Tried first, replaced. Re-implementing ARIA wiring, keyboard navigation, and positioning from scratch duplicates what a primitives library already gets right, for no benefit over adopting one.
- **cmdk.** Virtualization-friendly, but would still require hand-building positioning and some ARIA wiring that Base UI provides directly.
- **Extend Radix `Select`.** Not viable: its item-registration model scales with option count independently of the DOM, which is the exact problem being solved.
