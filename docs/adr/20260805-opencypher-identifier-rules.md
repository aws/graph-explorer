# ADR — openCypher identifier rules and a full-failure schema sync

- **Status:** Accepted
- **Date:** 2026-08-05
- **Related:** `connector/openCypher/fragments.ts` (`identifier()`); `connector/queryValueError.ts` (`EmptyIdentifierError`, `UnescapableValueError`); `connector/queryFragment.ts` (`FragmentPosition`). Issue #2020.

## Context

An openCypher identifier — a property key or a label — is delimited with backticks. A backtick inside the name is escaped by doubling it; there is no escape for anything else inside the delimiter. Two names cannot be carried at all: an empty name, which selects nothing, and a name carrying a C0 control character (U+0000–U+001F).

The empty case is not a forbidden-character case: an empty backtick-quoted name emits ` ` ``, which reads as a different grammar position rather than as an identifier. The control-character case is genuinely a forbidden-character case, but on narrower grounds than an earlier draft assumed. That draft justified rejecting control characters because the whole-query whitespace pre-pass would strip a trailing control character and corrupt the name; #2055 dissolved that reasoning by splicing interpolated values in verbatim, so the pre-pass no longer touches them. The rejection stands on what remains: a control character in a node label is malformed data, and a backtick-quoted name spanning lines wrecks the legibility of the assembled query.

Both label and property-key discovery run on a background schema-sync path, where a rejection propagates rather than surfacing at an interactive call site.

## Decision

`identifier()` refuses an empty name (`EmptyIdentifierError`) and a name carrying a control character (`UnescapableValueError`, the same class SPARQL's `iri()` throws for an IRI-forbidden character), and doubles an embedded backtick in the emitted text. The control-character check is a local collector mirroring SPARQL's `forbiddenIriCharacters`: the fragment module owns which characters the position forbids and passes the offenders to the error to report. This is deliberately stricter than the shared representability guard, which refuses only NUL among the controls; the identifier position forbids the whole control range, and both checks are kept.

Empty and control names are **rejected, not coerced**. Dropping the offending characters or substituting a placeholder would query a different label than the graph holds — an identifier is a lookup key, so a silent rewrite returns the wrong entity.

`FragmentPosition` gains `"identifier"` alongside `"IRI"` and `"id"`. This is a genuine grammar position in a query, unlike the `"number"` axis that was deliberately kept out of the error hierarchy as a value-kind masquerading as a position.

A rejection on the background schema-sync path is an accepted **full failure** of the sync request — the latched failure state, not a skip-and-log that would drop the offending label and quietly present an incomplete schema. A better background-path experience is deferred.

## Consequences

The full-failure choice is hard to reverse and surprising: a reader who sees schema sync break on one odd label would reach for skip-and-log to keep the rest of the sync flowing. That is the wrong fix here — partial schema silently hides data — so the decision is recorded rather than left to inference. Because the forbidden set is grammar-specific, the openCypher fragment module owns it, exactly as the SPARQL module owns the IRI-forbidden set.
