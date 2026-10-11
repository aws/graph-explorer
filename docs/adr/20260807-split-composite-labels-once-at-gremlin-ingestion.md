# ADR — Split composite labels once at the Gremlin ingestion boundary; keep the whole string when a segment is empty

- **Status:** Accepted
- **Date:** 2026-08-07
- **Related:** Epic #2020 (Query Fragment initiative); supersedes the scattered `.split("::")` handling that PR #2036 would have unified. Complementary to the Gremlin `fragment.identifier` empty-identifier refusal (a separate change).

## Context

Amazon Neptune joins the multiple labels of a vertex with `::` (`g.addV("A::B")`), and its Gremlin API surfaces that composite as a single `::`-joined string in the element/`elementMap` label field, in `by(label)` group keys, and in `outV()/inV().label()`. Graph Explorer's own domain model holds only **single** labels — a `VertexType` is one label — because multi-labels are split apart at ingestion.

Historically the `::` split was inlined at eight connector sites with two inconsistent handlings (`.split("::").filter(Boolean)` at some, bare `.split("::")` at others), and applied at sites that were splitting Graph Explorer's own already-single-label domain ids rather than a raw Neptune wire value.

Two facts, verified live, shaped the decision:

- **`::` is Neptune-specific and reserved.** Neptune reserves `::` as the multi-label delimiter, so a real segment is never empty and a single stored label can never contain `::`. Core TinkerPop (JanusGraph, Gremlin Server, TinkerGraph) mandates one immutable label per element with no reserved characters — there, a label may legitimately _be_ `foo::bar` or `foo::`. openCypher never exposes `::` at all; it returns labels as a JSON array.
- **There is no reliable Neptune-vs-generic discriminator** at the split sites, and none is available to plumb in cheaply.

## Decision

**Split `::` exactly once, at the Gremlin ingestion boundary; domain `VertexType`s are single-label and are never re-split.**

1. **One shared helper, `connector/gremlin/splitLabel.ts`.** It owns the `::` convention and the empty-segment rule. Gremlin-only — openCypher has no `::` on the wire, and the fragment modules are already strictly per-language.
2. **The delimiter is precisely two colons.** A run of one, three, or more colons (`foo:bar`, `foo:::bar`) is part of a label and does not split — the helper splits only on a `::` with no adjacent colon.
3. **Keep-whole on any empty segment.** If splitting yields any empty segment — trailing (`foo::`), leading (`::foo`), doubled (`a::::b`), or lone (`::`) — the helper discards the split and returns the original string as a single label. An empty segment signals that the `::` is not our delimiter (a generic-TinkerPop label, or otherwise unexpected input), so we do not guess a split that would misidentify the label.
4. **Split only at the five ingestion sites** that consume raw Neptune wire labels: `mapApiVertex`, `fetchEdgeConnections`, `verticesSchemaTemplate`, `edgesSchemaTemplate`, `neighborCounts`.
5. **Delete the split at the three sites that operated on domain ids** (Gremlin `fetchNeighbors/oneHopTemplate`, `keywordSearch/keywordSearchTemplate`, openCypher `fetchNeighbors/oneHopTemplate`). Their inputs (`filterByVertexTypes`, `vertexTypes`) are already single-label `VertexType` ids; re-splitting them was a no-op on real data and wrong for a generic backend.
6. **The helper does not refuse the empty string.** `splitLabel("")` returns `[""]`; empty-identifier refusal is the fragment layer's job. The one exception is `mapApiVertex`, where an empty element label means _no labels_ and maps to `[]` at that boundary.

## Considered Options

- **Keep-whole on empty (chosen).** Least-harmful across vendors: a generic label `foo::` survives intact, and a Neptune composite still splits. Matches the intuition "an empty segment means `::` probably isn't our separator."
- **`.filter(Boolean)` (drop empty segments).** Rejected: silently resolves `foo::` → `foo`, querying the wrong vertex type — the misidentification we set out to remove.
- **Throw on any empty segment.** Rejected: for a generic TinkerPop backend, `foo::` is a _valid_ single label, so throwing would break a legitimate graph.
- **Gate the split on the backend being Neptune.** Rejected for now: no reliable discriminator exists and plumbing one to the ingestion sites is a separate architectural change. Tracked as a follow-up, blocked by the connection database-type work (#1329, consuming #271).

## Consequences

- **The split is applied unconditionally, which is correct only for Neptune.** For a generic TinkerPop backend whose single label contains `::`, ingestion still breaks it apart. This is unchanged from prior behavior (the split was always unconditional) and is the known limitation the follow-up issue addresses.
- **Contractual tests changed at the three delete sites.** Tests that asserted `country::capital` expanded to `hasLabel('country', 'capital')` now assert it is used verbatim, reflecting that these inputs are single-label domain ids.
- **`mapApiVertex` treats an empty label as no labels** (`[]`), preserving prior `.filter(Boolean)` behavior for that specific boundary without reintroducing the `foo::` → `foo` bug.
