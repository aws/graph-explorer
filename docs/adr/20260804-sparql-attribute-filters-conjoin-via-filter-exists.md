# ADR — Conjoin SPARQL attribute filters with `FILTER EXISTS`

- **Status:** Accepted
- **Date:** 2026-08-04
- **Related:** Affects `connector/sparql/fetchNeighbors/oneHopNeighborsTemplate.ts` (`getFilterTemplate`), inherited by `oneHopNeighborsBlankNodesIdsTemplate.ts`. The disjunction dates to the initial port commit `8a6eac7d` (2022-11-28). Gremlin (`and(...)`) and openCypher (`AND`) have conjoined since their first commits.

## Context

The neighbor expansion panel ("Filter to narrow results") lets a user add several attribute filters. Gremlin and openCypher require every filter to match. SPARQL joined its per-filter conditions with `||`, so a neighbor matched when _any_ filter matched — on an RDF connection a second filter **widened** results instead of narrowing them.

Measured against a 1.19M-triple fixture, expanding a 50,000-member hub:

| filters | correct | disjunction returned | error  |
| ------- | ------- | -------------------- | ------ |
| 2       | 29      | 4,455                | 154x   |
| 3       | 9       | 20,395               | 2,266x |

The error grows with each filter added, and the query never failed — users received wrong results quickly enough not to suspect them. Single-filter expansion was unaffected, which is why this survived.

The same connector already contradicted itself: `storedBlankNodeNeighborsRequest.ts`, the in-memory path for stored blank nodes, has required every filter to match since 2023.

Git history offers no justification. The disjunction has been present in every revision since the port, no commit, PR, or issue explains it, and no conjunction was ever attempted. The likely cause is visible in the query shape: every filter shared one `?neighbor ?pValue ?object` triple pattern, so the naive fix — swapping `||` for `&&` — requires a single `?pValue` to equal two attribute IRIs at once and **matches nothing** (verified: 0 rows). Conjunction requires restructuring the pattern, so the disjunction is best read as the shape someone could get working rather than a decision.

## Decision

Give each filter its own `FILTER EXISTS`, and drop the shared unbound triple pattern:

```sparql
FILTER EXISTS {
  ?neighbor <…/teamName> ?filterValue .
  FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Arsenal", "i"))
}
FILTER EXISTS {
  ?neighbor <…/nickname> ?filterValue .
  FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Gunners", "i"))
}
```

A filter is satisfied when **any** value of that attribute contains the filter's value (existential). This matters in RDF, where a subject may carry a predicate repeatedly: two filters on the same attribute can be satisfied by two different values, which is the intuitive reading and what the property-graph connectors do for their single-valued attributes.

## Considered Options

- **`FILTER EXISTS` per filter (chosen).** Correct, portable, and no regression on any measured scenario. On the 50k hub it is both correct and ~3x faster than the disjunction it replaces (1.94s vs 6.01s, using the exact query the code generates).
- **One bound triple pattern per filter** (`?neighbor <pred> ?filterValue0 .` repeated). Equally correct and the _fastest_ option on hub expansion — Neptune folds each regex into the index scan, so cost falls as filters are added (18ms vs 21ms in a subquery benchmark). Rejected because it regresses the **common** case: expanding an ordinary low-degree node went from 18ms to ~790ms, since Neptune applies the filters first and scans the whole attribute index to discard nearly everything. That floor scales with the index size, so it worsens on larger stores. It also emits cross-product duplicate rows on repeated predicates (measured 1.30x inflation), harmless today only because the enclosing projection is `SELECT DISTINCT ?neighbor`.
- **Bound patterns plus `hint:joinOrder "Ordered"`.** Fixes that regression outright (792ms to 56ms) and is fastest everywhere. **Rejected on portability, and the failure mode is silent.** `hint:` is a Blazegraph/Neptune extension; the hint line is syntactically an ordinary triple pattern, so other engines try to match it, find nothing, and make the whole group unsatisfiable. Verified against a live third-party SPARQL store: the same query returned 3 rows without the hint and **0 rows, with no error,** with it. Graph Explorer ships a BlazeGraph connection guide and supports arbitrary SPARQL 1.1 endpoints, so a silent empty result on non-Neptune stores is unacceptable. Emitting it only for Neptune would also mean threading connection metadata into the pure template layer, which today takes only a request.
- **Keep the disjunction and document it as RDF-appropriate.** RDF's repeated predicates and mixed literal types do make "every filter matches" a subtler claim than in a property graph, but that argues about _how_ to conjoin, not _whether_ to. Nothing makes "any one filter matches" the natural reading of filters under a heading that says "narrow results", and the connector's own blank-node path already conjoins.

## Consequences

- Multi-filter neighbor expansion now narrows on RDF, matching Gremlin and openCypher, and matching the `CONTEXT.md` glossary and the `AttributeFilter` doc comment, which already stated that every filter must match. Those descriptions become true rather than needing correction.
- Users who had unknowingly relied on the widening behaviour will see fewer results from a multi-filter expansion. This is the documented and intended behaviour.
- `?pValue` is gone from the template. The unbound `?neighbor ?pValue ?object` pattern was the dominant cost — it materialised every literal on every candidate (751,934 intermediate solutions on the hub benchmark) before discarding ~97%.
- If the enclosing subquery ever stops projecting `SELECT DISTINCT ?neighbor` alone, revisit: the bound-pattern form's duplicate hazard becomes relevant, and that projection is what makes either shape safe under `LIMIT`.
- **Residual divergence, not addressed here:** the in-memory blank-node path reads a single value per attribute (`vertex.attributes[filter.name]`), so it is not existential over repeated predicates the way the query path is. That is a limitation of the flattened in-memory vertex model and predates this change.
- Moving the attribute name into a triple pattern raises the stakes on IRI construction. `fragment.iri` wraps its value in angle brackets without validating it, so a `>` in a predicate IRI used to break out into a boolean expression — where SPARQL's grammar rejects triple patterns — but now breaks out into a graph pattern, where `GRAPH` and `SERVICE` are legal. Both forms were tried against Neptune: the old one is a parse error, the new one executes. Validating the IRI position is being handled separately; the predicate name comes from schema discovery rather than free text, so reaching this needs a poisoned predicate IRI in the store.

## Verification

The measurements above come from an ad hoc 1.19M-triple RDF fixture generated for this decision and loaded into the named graph `<http://graph-explorer.test/filter-benchmark>` on a private development Neptune cluster: 100,000 `Person` resources across 8 literal attributes, 4,948 subjects carrying repeated predicates, and 20 `Organization` hubs from 1,000 to 50,000 members. The generator is not committed and the cluster is not reachable by community contributors, so treat the numbers as recorded evidence rather than a suite anyone can re-run. Both candidate shapes were also confirmed to parse on Neptune 1.2.1.0 and 1.3.5.0, so neither introduces a version-floor regression.
