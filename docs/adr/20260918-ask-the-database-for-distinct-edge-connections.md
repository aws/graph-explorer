# ADR — Ask the database for distinct edge connections instead of sampling edges

- **Status:** Accepted
- **Date:** 2026-09-18
- **Related:** Fixes [#2141](https://github.com/aws/graph-explorer/issues/2141). Replaces the Gremlin half of [#2100](https://github.com/aws/graph-explorer/pull/2100), which batched edge connection discovery for [#2085](https://github.com/aws/graph-explorer/issues/2085). openCypher and SPARQL keep their `#2100` shapes.

## Context

Edge connection discovery finds which vertex types each edge type connects. Since 3.2.2 the Gremlin connector batches it into one query per 100 edge types:

```gremlin
g.E().hasLabel('A','B','C')
  .group().by(label())
    .by(limit(10000).project('sourceType','targetType')
          .by(outV().label()).by(inV().label()).dedup().fold())
```

The per-type `limit` caps sampling inside each bucket but not the scan that fills the buckets. `group()` enumerates every edge of the batched types first, and Neptune does not convert it to a native step, so it materializes one item per edge outside the engine. A customer with three edge types over 19.9M edges gets `MemoryLimitExceededException` after about 30 seconds and an error in the Schema View.

Reproduced on a purpose-built 1M-edge graph: the same failure at 35.5s. The profile shows 57,538 items crossing into the query layer on a 57k-edge graph and `GroupStep` consuming 88% of runtime, with an explicit "not supported natively" warning on both DFE and non-DFE Neptune.

`#2100`'s doc comment claims a per-type scan cap "is not expressible in one native TinkerPop 3.6.2 request". That is false, and the counter-example already shipped two directories away in `fetchSchema/edgesSchemaTemplate.ts`.

Three facts, all measured live, shaped the decision:

- **`groupCount()` keyed by a projection is native and memory-lean.** It returns one item regardless of graph size, because the accumulator is keyed by the answer rather than the input. Verified native and correct on Neptune 1.2.1.0 (our TinkerPop 3.6.2 floor), 1.3.5.0, 1.4.5.1 on an instance with no DFE, and 1.4.7.0, plus reference TinkerPop 3.6.2 and 3.7.3.
- **The ceiling for an unsampled scan is unpredictable from the client.** On DFE it fails on memory between 100,000 and 150,000 edges in under 12 seconds. On a non-DFE instance of the same hardware class it survives 550,000 and fails on time at 1M. Different limits, different failure modes, and neither DFE presence nor instance memory is visible to us.
- **Several plausible query shapes are silently wrong.** See Considered Options.

## Decision

**Ask for the distinct `(edgeType, sourceVertexType, targetVertexType)` combinations directly, with one template and two strategies.**

```gremlin
g.E()[.hasLabel(...)][.limit(10000)]
  .groupCount().by(project('e','s','t')
    .by(label()).by(outV().label()).by(inV().label()))
```

1. **Complete strategy.** No `limit`. Returns every edge connection plus exact edge counts. Split across requests when the graph exceeds the scan budget; chunking is this strategy issued N times, not a third strategy.
2. **Sampled strategy.** `hasLabel(X).limit(10000)`, one request per edge type. Matches today's sampling semantics.
3. **Choose by comparing predicted cost.** Complete scales with edge count, sampled with edge type count. Below the budget, take complete. Above it, take the cheaper of `edgeTypes x 1.5s` and `edges x 85us`.
4. **Scan budget is 50,000 edges, and it is not a safety prediction.** It is the highest volume that never failed on any configuration tested. Given the measured spread, no constant can predict the real ceiling.
5. **The degrade path is what recovers from a budget we cannot predict.** A complete request that fails because it was too big abandons the complete strategy and redoes the whole discovery as sampled. The trigger is our own request timeout, with Neptune's `MemoryLimitExceededException` and `TimeLimitExceededException` as a fast path. Fail fast on the first such error and do not retry individual chunks.
6. **Degrading applies only when the strategy was chosen automatically.** A user who forces complete gets the failure reported. Silently sampling would contradict the setting.
7. **The `count` the complete strategy returns is not persisted.** The `EdgeConnection.count` field stays unpopulated, because the same field would be capped and misleading on the sampled path.

The decision is evaluated in the Gremlin connector, by a pure `planDiscovery` that takes the edge types, the edge total, and the setting, and returns the strategy with the requests it takes.

`EdgeConnectionsRequest` carries `{ edgeTypes, totalEdges }`, and openCypher and SPARQL ignore the total. The setting is not part of the request: it is connection configuration like `fetchTimeoutMs`, so `normalizeConnection` resolves its absence to `auto` and the Gremlin explorer reads it from the connection it was built with.

A complete scan that is abandoned leaves no runaway behind, because `mapWithConcurrency` stops pulling work once a callback rejects. Requests already in flight are not cancelled: without a per-request `queryId` the proxy cannot cancel them at the database either, so aborting the client side would only stop us waiting for a result we have already discarded.

## Considered options

- **`groupCount().by(project(...))` (chosen).** Native on every engine tested, one item returned, correct direction, `::` composite labels preserved.
- **Keep `group().by(label()).by(limit(...))`.** Rejected: the shape that fails. Not native, and holds one item per edge.
- **`dedup()` on a projected map.** Rejected as silently wrong. Returned 5 of 13 expected combinations on Neptune 1.2.1.0, because `dedup()` does not compare projected maps by content. Same defect in `g.V().outE().project(...).dedup()` and `path().by(label())`.
- **`groupCount()` keyed by `union(label(), outV().label(), inV().label()).fold()`.** Rejected as silently wrong, and the most dangerous of the three: it is native and looks correct, but `union()` does not guarantee order and DFE permuted the key on 1.3.5.0, reporting `contains` as `airport -> continent` when the truth is `continent -> airport`. A named `project()` key is what makes the chosen shape safe.
- **Anchored per-type sub-traversals,** `g.V().limit(1).project(types).by(V().outE(type).limit(n)...)`. Rejected as silently wrong: it samples in vertex scan order, so it missed an endpoint pair occurring 50 times against 550,000 on the 1M reproduction. Also linear in edge type count, at roughly 0.23s per type.
- **`union` with mid-traversal `E()` per arm.** Rejected: requires TinkerPop 3.7, so it drops Neptune 1.2.x and 1.3.x, and it only ties the 3.6.2-compatible options on the case we care about while still scaling linearly in edge type count.
- **Raise the minimum TinkerPop version to 3.7.** Rejected: the profile shows `E().hasLabel()` inside a union arm is not index-backed on Neptune, so a sparse edge type still scans the whole edge store per arm. We would pay a compatibility cost and still need the same strategy split.

## Consequences

- **The `#2085` request collapse is preserved and improved for most graphs.** A 10,015-edge-type graph goes from 101 requests to 2 at the 50,000 budget, and to 1 on any graph under it.
- **Sampled coverage is engine-dependent, and only complete looks at every edge.** On Neptune, sampled found a pair occurring 50 times in 550,050. On reference TinkerPop 3.6.2 and 3.7.3 the same test missed it, because TinkerGraph iterates in insertion order. The user-facing description for the sampled setting must say this plainly rather than imply it is theoretical.
- **Attempting complete and degrading costs the user time.** On a graph above the budget, the first sync spends 8 to 12 seconds discovering that complete does not fit. That is the price of the budget being a guess rather than a prediction.
- **The cost constants are Neptune-derived.** 85 microseconds per edge and 1.5s per request come from Neptune measurements and will be wrong for JanusGraph on Cassandra. Tolerable because the crossover is insensitive, with real graphs sitting one to three orders of magnitude away from it, but the numbers are not universal.
- **Sampled's flat per-request cost depends on an edge type index.** Neptune pushes `hasLabel` into its label index. TinkerGraph has no such index, so `hasLabel(X).limit(n)` scans until it collects n of that type, and a sparse type on a large graph could scan much further than the cap suggests.
- **Nothing above 1M edges is tested.** The reported graph is 19.9M and one known case is 775M. Sampled work per request is capped by construction, so scale affects timing rather than correctness, but the budget is extrapolated.
- **A graph that is both very large and has very many edge types has no cheap option.** Sampling it is a request storm and scanning it takes hours. No reported case has that shape, but our visibility is limited to graphs that generate a ticket, so this is unmeasured rather than ruled out.
- **The `EdgeConnectionDetails` panel keeps showing an overcount.** It displays the edge type's aggregate total on an edge connection panel, which overcounts whenever an edge type has more than one connection. The complete strategy could fix this for free, but wiring it would make a displayed number depend on which strategy ran. Tracked separately.
