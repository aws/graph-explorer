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

**Ask for the distinct `(edgeType, sourceVertexType, targetVertexType)` combinations directly, with two strategies and one query shape for each.**

Complete:

```gremlin
g.E()[.hasLabel(...)]
  .groupCount().by(project('e','s','t')
    .by(label()).by(outV().label().fold()).by(inV().label().fold()))
```

Sampled, one limited branch per edge type:

```gremlin
g.V().limit(1).union(V().outE('A').limit(10000), V().outE('B').limit(10000), ...)
  .group().by(label())
  .by(project('s','t').by(outV().label().fold()).by(inV().label().fold()).groupCount())
```

The endpoint labels are folded because engines disagree on what `label()` emits for a multi-label vertex. Neptune 1.2 and 1.4 emit one `::` composite; 1.3.5 emits each label as its own value, so an unfolded `by(outV().label())` kept only the first and silently dropped the vertex's other types. Measured on a fixture of `a::b` and `d::e::f` vertices on all four versions. The parser splits every folded entry on `::`.

1. **Complete strategy.** No `limit`. Returns every edge connection plus exact edge counts. Split across requests when the graph exceeds the scan budget; chunking is this strategy issued N times, not a third strategy.
2. **Sampled strategy.** Each edge type gets its own limited `union()` branch, `g.V().limit(1).union(V().outE('A').limit(10000), ...)`, 10 edge types per request, grouped by edge type before counting: `.group().by(label()).by(project('s','t').by(outV().label().fold()).by(inV().label().fold()).groupCount())`. Grouping first is for DFE, which could not count one `project()` key across several full branches: on 1.3.5.0 two took 54s and five timed out, where grouping first handled ten in 9.4s. Grouping holds each type's sample until it is counted, so a request holds at most the batch times the limit, 100,000 edges; the complete strategy has no limit and keeps `groupCount()`, because grouping an unlimited 550,000-edge type ran out of memory on 1.4.5.1. Matches the earlier one-request-per-type semantics with a tenth of the requests. On Neptune's default engine each branch is an index lookup by edge label, and it returned the same combinations and counts as one request per type on 1.4.5.1 and 1.4.7.0, including missing the same planted rare combinations. On TinkerGraph it samples in vertex order rather than edge order, so it misses different rare combinations than a per-type request would, not more. The batch is sized for the worst case of every branch reaching its limit, 100,000 edges, because a type's count is unknown until read: 10 full branches took 9.7s on a db.t3.medium, 100 took 116s and left the instance refusing even single-type samples on memory for two minutes. The budget is per request, and requests run four at a time; four concurrent requests of 10 full branches finished in 36s on both db.t3.medium instances, with and without DFE, and left them answering normally. A separate cap of 100 branches keeps the batch under Gremlin Server's Groovy argument limit if the per-type limit ever shrinks. `DiscoveryStrategy` carries a third value, `none`, for a schema with no edge types; that is a guard clause rather than a strategy choice.
3. **Choose by comparing predicted cost.** Complete scales with edge count, sampled with edge type count. Below the budget, take complete. Above it, take the cheaper of `edgeTypes x 1.5s` and `edges x 85us`. Sampled stays charged per edge type after batching, because a branch that reaches its limit costs as much as the separate request it replaced. With no recorded edge total, sample only when `edgeTypes x 1.5s` fits 60 seconds, 40 edge types or fewer, and otherwise run a complete scan in chunks of 100 edge types.
4. **Scan budget is 50,000 edges, and it is not a safety prediction.** It is the highest volume that never failed on any configuration tested. Given the measured spread, no constant can predict the real ceiling.
5. **A second bound caps the query text, at 60,000 characters of edge type names.** The edge total says how much a request reads; it says nothing about how much it carries. A graph with thousands of edge types would otherwise name them all in one filter, so the two bounds are enforced independently and a chunk splits when either is reached. Also the largest size measured rather than the point of failure: 5,008 names of 11 characters completed in 7.1s on 1.4.7.0.
6. **The degrade path is what recovers from a budget we cannot predict.** A complete request that fails because it was too big abandons the complete strategy and redoes the whole discovery as sampled. The trigger is our own request timeout, with Neptune's `MemoryLimitExceededException` and `TimeLimitExceededException` as a fast path. Fail fast on the first such error and do not retry individual chunks.
7. **An automatic complete request is bounded at 20 seconds, separately from the connection's fetch timeout.** That timeout defaults to four minutes, so leaving the degrade path to it would make a graph above the budget wait four minutes for a schema it could have sampled in one. 20 seconds is over three times the cost of reading the whole scan budget at the slowest rate measured, and under the 30 to 35 seconds at which Neptune failed in both reproductions, so we give up before the database does. A forced complete is not bounded, because it has nothing to degrade to.
8. **Degrading applies only when the strategy was chosen automatically.** A user who forces complete gets the failure reported. Silently sampling would contradict the setting.
9. **The `count` the complete strategy returns is not persisted.** The `EdgeConnection.count` field stays unpopulated, because the same field would be capped and misleading on the sampled path.

The decision is evaluated in the Gremlin connector, by a pure `planDiscovery` that takes the edge types, the edge total, and the setting, and returns the strategy with the requests it takes.

`EdgeConnectionsRequest` carries `{ edgeTypes, totalEdges }`, and openCypher and SPARQL ignore the total. The setting is not part of the request: it is connection configuration like `fetchTimeoutMs`, so `normalizeConnection` resolves its absence to `auto` and the Gremlin explorer reads it from the connection it was built with.

An abandoned attempt is cancelled rather than merely ignored. `mapWithConcurrency` stops pulling new work once a callback rejects, and every request carries its own `queryId` and abort signal, so aborting the attempt closes the connections still open and the proxy turns each one into a `cancelQuery` at the database. Without that, the chunks already in flight would keep scanning for a result nobody is waiting for, and on the degrade path they would compete with the sampled requests that replace them.

Giving up produces an `EdgeConnectionDiscoveryError` rather than the database's error, because only we know which recovery path is still open: a forced complete has a setting to change, while a failed sample has already exhausted the cheaper options. The original error is the `cause`, so the error details dialog still shows what the database said. Failures that are not about size propagate untouched, since the existing display wording already reads a refused connection or a bad URL correctly.

## Considered options

- **`groupCount().by(project(...))` (chosen).** Native on every engine tested, one item returned, correct direction, and every label of a multi-label vertex preserved once the endpoint labels are folded.
- **The same shape with unfolded endpoint labels.** Rejected as silently wrong on 1.3.5.0, where it returned `b` for an `a::b` vertex in both the complete and sampled strategies. The shape it replaced, `group().by(label()).by(project(...).dedup().fold())`, returned both labels there, so this was a regression.
- **Keep `group().by(label()).by(limit(...))`.** Rejected: the shape that fails. Not native, and holds one item per edge.
- **`dedup()` on a projected map.** Rejected as silently wrong. Returned 5 of 13 expected combinations on Neptune 1.2.1.0, because `dedup()` does not compare projected maps by content. Same defect in `g.V().outE().project(...).dedup()` and `path().by(label())`.
- **`groupCount()` keyed by `union(label(), outV().label(), inV().label()).fold()`.** Rejected as silently wrong, and the most dangerous of the three: it is native and looks correct, but `union()` does not guarantee order and DFE permuted the key on 1.3.5.0, reporting `contains` as `airport -> continent` when the truth is `continent -> airport`. A named `project()` key is what makes the chosen shape safe.
- **Anchored per-type sub-traversals,** `g.V().limit(1).project(types).by(V().outE(type).limit(n)...)`. Rejected: Neptune cannot run a traversal inside `project().by()` natively, so it costs roughly 0.23s per type. Its miss of an endpoint pair occurring 50 times against 550,000 was measured on 1.3.5.0, where one request per type misses the same pair, so it is not evidence against sampling from `V()`. The `union()` form of the same idea is native and is the chosen sampled strategy.
- **One shared limit per batch,** `g.E().hasLabel(A, B, ...).limit(n)`. Rejected as silently wrong: on 1.4.7.0 `route` filled a limit of anything from 100 to 20,000 on its own, and 99 of 100 edge types in the batch came back empty.
- **Larger sampled batches.** Rejected. Beyond the time and memory cost of full branches above, Gremlin Server compiles the script as Groovy and a call cannot take more than about 250 arguments, so `union()` fails outright above 250 branches on 3.6.2 and 252 on 3.7 and 3.8. Neptune's DFE engine crashed a db.t3.medium on a 200-branch batch.
- **`project()` inside each `union()` branch.** Rejected: faster on DFE, but on the default engine it returned only the first label of a multi-label vertex, and ran out of memory on 1.4.5.1 at 250 branches where the chosen shape did not.
- **`union` with mid-traversal `E()` per arm.** Rejected: requires TinkerPop 3.7, so it drops Neptune 1.2.x and 1.3.x, and it only ties the 3.6.2-compatible options on the case we care about while still scaling linearly in edge type count.
- **Raise the minimum TinkerPop version to 3.7.** Rejected: the profile shows `E().hasLabel()` inside a union arm is not index-backed on Neptune, so a sparse edge type still scans the whole edge store per arm. We would pay a compatibility cost and still need the same strategy split.

## Consequences

- **The `#2085` request collapse is preserved and improved for most graphs.** The 10,015-edge-type graph generated to test this goes from 101 requests to 3 at the two budgets, and to 1 on any graph under the scan budget. The character budget costs one request over what the scan budget alone would ask for, and buys a bound that holds however long the edge type names are.
- **Sampled coverage is engine-dependent, and only complete looks at every edge.** On Neptune, sampled found a pair occurring 50 times in 550,050. On reference TinkerPop 3.6.2 and 3.7.3 the same test missed it, because TinkerGraph iterates in insertion order. The user-facing description for the sampled setting must say this plainly rather than imply it is theoretical.
- **Attempting complete and degrading costs the user time.** On a graph above the budget, the first sync spends 8 to 12 seconds discovering that complete does not fit, or 20 seconds when the database neither answers nor refuses. That is the price of the budget being a guess rather than a prediction.
- **A 20 second bound can degrade a scan that would have finished.** A graph whose edges are concentrated in one edge type gets chunks balanced by edge type count, not by edge count, so a single chunk can read far more than the budget and still have been on its way to succeeding. The cost of getting it wrong is a sampled schema, which can miss a rare connection; the cost of not bounding it is a four minute wait. Worth it in that trade, but it is a trade.
- **The cost constants are Neptune-derived.** 85 microseconds per edge and 1.5s per request come from Neptune measurements and will be wrong for JanusGraph on Cassandra. Tolerable because the crossover is insensitive, with real graphs sitting one to three orders of magnitude away from it, but the numbers are not universal.
- **Sampled's flat per-branch cost depends on an edge type index.** Neptune turns each `V().outE(X)` branch into a label index lookup. TinkerGraph has no such index, so a branch for a sparse type walks every vertex. Batching still wins there, because the fixed cost of a request is paid once: 250 sparse types on a 1.8M-edge TinkerGraph took 4.3s as one request and 209s as 250.
- **Sampled batches are sized for the worst case.** A graph of mostly sparse edge types would finish in far fewer requests at a larger batch, but nothing before the read says which types are sparse. Weighting batches by the per-type edge counts the schema sync sometimes records is left to #2254.
- **Nothing above 1M edges is tested.** The reported graph is 19.9M, and graphs an order of magnitude larger than that exist. Sampled work per request is capped by construction, so scale affects timing rather than correctness, but the budget is extrapolated.
- **A graph that is both very large and has very many edge types has no cheap option.** Sampling it is still one request per 10 edge types, and scanning it takes hours. No reported case has that shape, but our visibility is limited to graphs that generate a ticket, so this is unmeasured rather than ruled out.
- **The `EdgeConnectionDetails` panel keeps showing an overcount.** It displays the edge type's aggregate total on an edge connection panel, which overcounts whenever an edge type has more than one connection. The complete strategy could fix this for free, but wiring it would make a displayed number depend on which strategy ran. Tracked separately.
