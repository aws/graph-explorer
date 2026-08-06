# ADR — SPARQL literal escaping and IRI forbidding

- **Status:** Accepted
- **Date:** 2026-08-05
- **Related:** `connector/sparql/fragments.ts` (`SHORT_ESCAPES` and `FORBIDDEN_IRI_CHARS`, the one place each is implemented); `connector/queryValueError.ts` (`UnescapableValueError`); `docs/agents/connectors.md`. Issue #2020.

## Context

A SPARQL string literal and a SPARQL IRI reference sit in different grammar positions, and they differ in a way that decides how a value that cannot be carried verbatim must be handled.

A double-quoted string literal is a quoted context with an escape mechanism. Its grammar forbids only the double quote, the backslash, and raw line feed and carriage return; the `ECHAR` production supplies short escapes for them plus a few whitespace controls. Escaping is identity-preserving, so any value that can reach a database at all can be carried in a literal (values no database can carry — a lone surrogate, a NUL — are refused earlier by the shared representability guard; see `docs/adr/20260805-refuse-unrepresentable-query-values.md`). The previous helper escaped only the double quote, and only when the value already contained one — so a lone backslash, or a control character in a value with no double quote, reached the query unescaped.

An IRI reference is **not** a quoted context and has **no escape mechanism at all**. Its grammar excludes `< > " { } | ^ ` \` and every codepoint in U+0000–U+0020 (which includes the space), and there is no `UCHAR` inside the SPARQL `IRIREF` production to encode them. A value carrying one of these characters cannot be represented as an IRI by any escaping.

## Decision

**Literals:** escape the full set the SPARQL `ECHAR` grammar requires — backslash, the double-quote delimiter, and the whitespace controls with a short form (`\b \t \n \f \r`) — using an explicit escape table, delimited with double quotes. The single quote is left bare, since it needs no escape in a double-quoted literal. A C0 control character without a short form is emitted **raw** rather than as `\uXXXX`: the SPARQL literal grammar has no `UCHAR`, and the whole-query codepoint pre-pass some tooling applies is backslash-aware, so escaping the backslash is sufficient and `\uXXXX` would be a mechanism outside the literal grammar.

**IRIs:** a value carrying a character the `IRIREF` grammar forbids is **reported, not altered** — `iri()` throws `UnescapableValueError` rather than emitting it. Percent-encoding is rejected as the alternative: RDF compares IRIs by simple string comparison with no percent-normalization, so encoding a forbidden character would name a different resource than the caller asked for — a query that runs and silently returns the wrong thing. Refusing is the only identity-preserving option.

Verified live against Neptune 1.2.1.0, 1.3.5.0, and 1.4.7.0: that each escape decodes as intended, that C0 controls are accepted raw inside a literal, and that the forbidden IRI characters are rejected by the parser whether written raw or via a codepoint escape.

## Consequences

The forbidding is strict by design: an IRI-shaped value that a graph legitimately stores but that carries a forbidden character (for example a space) cannot be queried, and the construction throws rather than degrading. Surfacing that rejection to the user is a separate concern from construction; this decision only fixes that the construction refuses the unrepresentable. Because the check is grammar-specific, the fragment module — not the shared error — owns which characters are forbidden and passes the offenders to the error to report.
