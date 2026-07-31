# ADR — Single-quoted Gremlin string literals

- **Status:** Accepted
- **Date:** 2026-08-03
- **Related:** `connector/gremlin/fragments.ts` (`toStringLiteral`, the one place this is implemented); `docs/agents/connectors.md` (the contributor rule); the Query Fragment modules introduced in #2035. Issue #2020.

## Context

Every Gremlin string literal Graph Explorer emits — string values, property keys, labels, and string entity IDs — comes from `toStringLiteral` in the Gremlin fragment module. Historically these were double-quoted, matching the examples in the TinkerPop documentation and in every Gremlin template in this repository.

Graph Explorer targets two different Gremlin front ends, and they do not parse a query the same way:

- **Neptune** parses with the ANTLR `gremlin-language` grammar. `$` is an ordinary character in a string literal, and a `\$` escape is a parse error.
- **Open-source Apache TinkerPop Gremlin Server and JanusGraph** parse the query with `GremlinGroovyScriptEngine`. A double-quoted Groovy string is a **GString**: an unescaped `$` begins interpolation (`$name`, `${...}`), so a value containing `$` is not preserved verbatim — the request either fails or the interpolated expression is resolved before the traversal runs.

A property key or attribute value containing `$` is ordinary data (`$total`, a price column, a template string), so this is reachable with legitimate input, and the two engines disagree about how to keep it intact.

## Decision

Gremlin string literals are delimited with **single quotes**. `toStringLiteral` takes `JSON.stringify`'s escaped body, unescapes `\"` back to `"` (no longer a delimiter), escapes `'` to `\'` (now the delimiter), and wraps the result in single quotes. `$` is deliberately left unescaped.

Groovy does not interpolate inside a single-quoted string, and the ANTLR grammar accepts single quotes, so a `$` is literal on **every** supported engine with no escape applied. This applies to the whole Gremlin surface, not just fragment output: the hardcoded step labels in the templates (`.as('start')`, `.project('vertex', 'edges')`) and the `@example` blocks are single-quoted too, so nothing in the codebase models the old form.

Verified live against Neptune 1.4.7.0 and an open-source Gremlin Server 3.7 over the HTTP endpoint Graph Explorer uses.

## Considered Options

- **Single-quote the literals (chosen).** One delimiter that is correct on both engines, no per-engine branching, no escape needed for `$`.
- **Escape the dollar as `\$`.** Correct for Groovy, but Neptune's grammar rejects `\$` outright — so this trades a wrong result on one engine for a hard failure on the other. There is no escape valid on both.
- **Keep double quotes and detect the engine.** Would require knowing which front end a connection talks to at query-construction time and emitting different text per engine. The connector does not have that information at the template layer, and it doubles the escaping rules to maintain and test.
- **Reject values containing `$`.** `$` is legitimate in real property keys and values; refusing them would break usable graphs to work around a delimiter choice.

## Consequences

- Every generated Gremlin query changed shape (double → single quotes), which is why the change touched roughly twenty templates and their exact-text assertions at once.
- The escaping rules inverted relative to intuition: inside a Gremlin literal a **double quote needs no escaping** and a **single quote does**. Test names must say so — a test that feeds a double quote proves nothing about escaping, because the character passes through bare. The discriminating character for "did this value go through the fragment constructor?" is the single quote.
- A future contributor reading TinkerPop documentation, or the `gremlin-query-compat` guidance, will see double-quoted examples and may try to "fix" this back. That is what this ADR exists to prevent.
- Neptune and TinkerPop remain on one code path; no engine detection was introduced.
