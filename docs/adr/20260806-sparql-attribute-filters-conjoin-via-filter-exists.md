# ADR — SPARQL attribute filters conjoin via FILTER EXISTS

- **Status:** Accepted
- **Date:** 2026-08-06
- **Related:** `connector/sparql/fetchNeighbors/oneHopNeighborsTemplate.ts` (`getFilterTemplate`), reached by `oneHopNeighborsTemplate` and, via `findNeighborsUsingFilters`, by `oneHopNeighborsBlankNodesIdsTemplate.ts`. `docs/agents/connectors.md`. Builds on `docs/adr/20260805-sparql-literal-escaping-and-iri-forbidding.md` (#2054, IRI forbidding) and #2058 (`CONTAINS`/`LCASE` substring matching).

## Context

When a user adds multiple Attribute Filters while expanding a neighbor, every filter must match (AND) — like Gremlin and openCypher already do, and like the UI ("Filter to narrow results") implies. The SPARQL template instead built one shared triple pattern `?neighbor ?pValue ?object` and OR-joined the per-filter conditions, so each added filter _widened_ the results rather than narrowing them. Against a 50,000-member hub, two filters returned 4,455 neighbors where 29 were correct (154×); three filters, 20,405 where 9 were correct (2,266×). Nothing errored — users just got silently wrong results.

This ADR is purely the OR→AND fix. IRI safety (a forbidden character in a predicate name throws `UnescapableValueError`, #2054) and literal substring matching (`CONTAINS(LCASE(STR(?v)), LCASE(...))`, never `regex`, #2058) already come from `main` and are unchanged.

## Decision

Emit one `FILTER EXISTS` block per filter and conjoin them by juxtaposition:

```sparql
FILTER EXISTS {
  ?neighbor <name1> ?filterValue .
  FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("val1")))
}
FILTER EXISTS {
  ?neighbor <name2> ?filterValue .
  FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("val2")))
}
```

The shared `?neighbor ?pValue ?object` pattern is dropped entirely. Every filter must match (AND); a single filter is satisfied when _any_ value of that attribute contains the value (existential — RDF may repeat a predicate). The predicate is built with `fragment.iri(filter.name)`, so IRI safety is inherited, not re-implemented.

## Considered options

Benchmarked against a 1.19M-triple Neptune 1.4.7.0 fixture. The chosen shape and today's OR shape were re-confirmed live: FILTER EXISTS returns the ground-truth 29; the OR shape returns 4,455.

1. **Naive `&&` on the shared `?pValue`** — matches nothing. One `?pValue` cannot equal two IRIs at once. This is almost certainly why the original author reached for OR.
2. **One bound triple pattern per filter** (no EXISTS) — correct and fastest on hubs, but regresses the common low-degree case ~18ms→~790ms (the engine filters-first and scans the whole attribute index). The only fix is `hint:joinOrder "Ordered"`, a Blazegraph/Neptune extension that **silently returns zero rows on other SPARQL engines** (verified live). Graph Explorer supports arbitrary SPARQL 1.1 endpoints, so that is disqualifying. Also emits duplicate rows on repeated predicates.
3. **`FILTER EXISTS` per filter (chosen)** — correct, portable, duplicate-free, no vendor hints, no regression on any measured scenario, ~3× faster than the OR shape on the hub case.

## Consequences

Moving the attribute name into a triple-pattern position (inside `FILTER EXISTS`) is what would make an unvalidated predicate IRI dangerous: a `>` in the IRI could break out into a graph pattern where `GRAPH`/`SERVICE` are legal. #2054 closes this as long as the predicate is built via `fragment.iri(...)` — which it is. Never hand-roll the IRI or bypass the fragment. Never emit `hint:` triples: they buy nothing here and silently zero out results off Neptune.
