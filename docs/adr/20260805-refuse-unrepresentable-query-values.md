# ADR — Refuse query values no database can carry

- **Status:** Accepted
- **Date:** 2026-08-05
- **Related:** #2020 (query-construction failure types). Builds on the `QueryValueError` hierarchy in `connector/queryValueError.ts`. Affects the fragment constructors in `connector/{openCypher,gremlin,sparql}/fragments.ts`.

## Context

A fragment constructor turns a raw value — a search term, a property key, an entity ID — into query text. Two classes of value cannot be transmitted faithfully to any database, in any of the three query languages, at any position:

- **Unpaired surrogate (U+D800–U+DFFF).** Half a UTF-16 code unit, with no Unicode scalar value and therefore no valid UTF-8 encoding. Every connector UTF-8 encodes its query text. On the openCypher/Gremlin path Neptune receives the JSON-escaped `\ud800`, returns HTTP 200, and silently substitutes `?` — the wrong data with no error. On the SPARQL path `encodeURIComponent` throws a raw `URIError` from deep inside the explorer.
- **NUL (U+0000).** Not representable in graph data. XSD 1.1 Part 2 §3.3.1.1 defines `xsd:string`'s value space via XML's `Char` production, which excludes U+0000. Neptune's openCypher and SPARQL endpoints reject it; Neptune's Gremlin endpoint rejects it in every graph-term position Graph Explorer generates.

`String.prototype.isWellFormed()` (ES2024) is false exactly for the surrogate case; `value.includes("\0")` covers the NUL.

## Decision

The fragment constructors **refuse** such a value rather than emit it. A single guard, `assertRepresentable(value)`, throws `UnrepresentableStringError` (a `QueryValueError`), and is called as the first statement of each of the eight string-accepting constructors across the three languages. The rule is language- and position-independent, so it is applied uniformly rather than per language.

## Considered Options

- **Refuse via a runtime guard (chosen).** A guard, not a boolean predicate, so a call site cannot forget to act on its result. A reflective conformance sweep (one test that enumerates every constructor via `Object.entries`) asserts that an unrepresentable value throws `UnrepresentableStringError`, so a ninth constructor added later is covered automatically. The sweep pins the concrete subclass rather than the base class: representability is refused uniformly regardless of language or position, so a constructor that reclassified an unrepresentable value as some other `QueryValueError` subclass would be a regression the sweep should catch.
- **A branded `RepresentableString` type**, making a missing guard a _compile_ error. A stronger guarantee, but it pushes validation up into the template layer and collides with the existing ID branding (`VertexId`/`EdgeId`) — a value would need to be both a `VertexId` and a `RepresentableString`. Rejected in favour of the runtime guard plus the conformance sweep.
- **Emit and let the database decide.** Rejected: acceptance without faithful semantics is worse than a clean refusal — see below.

## Consequences

- This is **deliberately stricter than SPARQL 1.1**, which makes NUL legal. Three non-Neptune SPARQL engines accept a NUL-bearing literal and then silently match the _wrong term_ (Blazegraph) or truncate it (Virtuoso). A value that is accepted but matches something other than what was written is worse than one that is cleanly refused, so we refuse it everywhere.
- **The check cannot be centralised.** By `toQueryFragment` or the transport boundary, escaping has already run: `JSON.stringify` has turned a NUL into the six characters `\u0000` and a lone surrogate into `\ud800`. There is nothing left to detect — a centralised check would inspect escaped text and always pass. The guard must see raw input, which forces it into the constructors. This is the non-obvious constraint a future reader would try to "clean up."
- **The error carries only `value`**, not language or position, because neither affects the outcome — no query of any kind can carry the value. If a debugger needs "which operation failed," that belongs at the catch boundary, where the calling hook already knows the operation (expand-node, keyword-search); it is not threaded down through the fragment layer. This is also why a `"number"`-style position axis would have been the wrong shape for the error's diagnostic context.
