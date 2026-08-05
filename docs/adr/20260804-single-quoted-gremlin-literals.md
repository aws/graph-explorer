# ADR — Single-quoted Gremlin string literals

- **Status:** Accepted
- **Date:** 2026-08-04
- **Related:** `connector/gremlin/fragments.ts` (`SHORT_ESCAPES`, the one place this is implemented); `docs/agents/connectors.md`. Issue #2020.

## Context

Graph Explorer sends Gremlin as script text, and the two front ends it supports do not parse that text the same way. Neptune uses the ANTLR `gremlin-language` grammar. Open-source Apache TinkerPop Gremlin Server and JanusGraph compile it with `GremlinGroovyScriptEngine`, so Groovy's rules apply.

That split leaves no way to carry a `$` through a **double-quoted** literal. A double-quoted Groovy string is a GString, where `$` introduces an expression to evaluate rather than a character to keep. The obvious remedy — escaping it as `\$` — is a hard parse error on Neptune. So one engine needs the escape and the other rejects it, and `$` is ordinary data: a price column, a template string, an attribute name someone chose.

## Decision

Delimit every Gremlin string literal with **single quotes**, and escape the single quote rather than the double quote.

A single-quoted Groovy string is a plain string with no interpolation, so `$` needs no escape on either engine — rather than detecting which front end a connection talks to, which the template layer does not know and which would mean maintaining two escaping rules. The escape set becomes backslash, the single-quote delimiter, and the five whitespace control characters that have a short form.

Tested directly against Neptune 1.2.1.0 and 1.4.7.0 and Gremlin Server 3.6.2 and 3.8 — the oldest and newest of each, which differ in Groovy version and in how they resolve unicode escapes: that both delimiters are accepted, that `$` survives verbatim in a single-quoted literal, that `\$` fails on Neptune, that `${...}` is evaluated in a double-quoted literal on the Groovy engines, and that each of the seven escapes decodes as intended. That single quotes are accepted _wherever_ double quotes are is read off the `gremlin-language` grammar, not exhaustively tested.

## Consequences

Escaping now runs opposite to intuition: inside a Gremlin literal a **double quote needs no escape** and a **single quote does**. A test that feeds a double quote therefore cannot tell a value that went through a fragment constructor from one a template wrapped in quotes by hand — both produce identical text. The discriminating character is the single quote, and the tests that prove routing feed one.
