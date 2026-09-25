# ADR — Resolve per-type graph styles through element-data mappers

- **Status:** Accepted
- **Date:** 2026-08-13
- **Related:** ADR `svg-geometry-ports-for-style-previews` and `coerce-retired-round-polygon-shapes` (other consumers of the same resolved style values). Issue #2104.

## Context

The graph canvas colours each vertex/edge by its type. The obvious Cytoscape idiom is one selector per type — `node[type="…"]`, `edge[type="…"]` — which is what `createGraphStyles` emitted. Cytoscape resolves an element's style by scanning every context, so a stylesheet with one selector per type makes style application O(elements × contexts). On a schema with ~10k vertex types + ~10k edge types this is ~20k contexts × ~20k elements; the Schema View pinned the main thread and never rendered (#2104), with ~88% of trace self-time in Cytoscape's `getPropertiesDiff`/`getContextStyle`.

## Decision

Precompute each element's resolved style values onto its Cytoscape `ele.data()` as `ge_*` fields (`vertexStyleData` / `edgeStyleData` in `core/StateProvider/graphElementStyleData.ts`) at the element-construction seams (`renderedEntities.ts` for the explorer graph, `useSchemaGraphData.ts` for the schema view), and read them back through a single `node` rule and single `edge` rule using Cytoscape `data(…)` mappers (`CANVAS_STYLES` in `useGraphStyles.ts`). The stylesheet is now O(1) in the number of types.

Two structured/optional properties can't be a plain always-present mapper, so they keep a gated selector that applies only when the field exists: `node[__iconUrl]` (background image; the field is omitted when a type has no icon) and `edge[ge_lineDashPattern]` (omitted for solid lines). The dotted→dashed remap, the dash-pattern lookup, the border-opacity derivation, and the `isDark` label-text-colour pick are baked into the producer functions so the stylesheet stays pure `data(…)`.

## Consequences

- The lockup is gone: a live 10k sync confirms the Schema View renders and Cytoscape style self-time drops from ~88% to ~0%. The next scaling wall is the fcose layout, tracked separately.
- **Producer and consumer must stay in lockstep.** A new per-type style property must be added in two places together — the `ge_*` field + its producer in `graphElementStyleData.ts`, and the matching `data(…)` mapper in `useGraphStyles.ts` `CANVAS_STYLES`. Editing one side alone silently drops the style.
- **A stylesheet consumer must merge into the base `node`/`edge` rules, never replace them.** `useSchemaGraphStyles` adds a schema label by spreading `{ ...baseStyles.node, label: … }`; overwriting the `node`/`edge` keys wholesale would discard every `ge_*` mapper and render the graph unstyled. Guarded by `useSchemaGraphStyles.test.tsx`.
- Context-count regression guards (`useGraphStyles.contextCount.test.tsx`, `useSchemaGraphStyles.test.tsx`) assert the selector count stays O(1) regardless of type count, so the per-type-selector approach can't creep back in unnoticed.
- A future reader seeing `data(ge_*)` mappers and no per-type selectors should not "restore" per-type selectors — that is the exact regression this avoids.
