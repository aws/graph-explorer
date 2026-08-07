# Connector & Explorer Patterns

## Connector Pattern

- Database connectors are separated by query language (gremlin, openCypher, sparql)
- Common interfaces are defined in `src/connector/index.ts`
- Each connector implements the same interface for consistent API

## Explorer Pattern

- "Explorers" abstract querying databases with different query languages
- Each explorer provides a unified interface for a specific query language
- Located in `src/connector/[query-language]/explorer/`
- Explorers handle query construction, execution, and result transformation
- They shield the application from query language specifics while providing consistent data structures

## Database Queries

- Use the `query` template tag from `@/utils` for all query strings (Gremlin, openCypher, SPARQL) to ensure consistent formatting. Note the tag only formats — it does not escape anything.
- Interpolate values into a query only as Query Fragments, from that language's `fragments.ts`. A fragment brings its own delimiters, so the template must not add quotes, backticks, or angle brackets around it.
- Each `fragments.ts` exports one `fragment` object: import it as `import { fragment } from "./fragments"` and call `fragment.string(...)`, `fragment.identifier(...)`, `fragment.id(...)` (Gremlin/openCypher) or `fragment.iri(...)` (SPARQL). Keep the `fragment.` qualifier at call sites — don't destructure — so the self-delimiting invariant stays visible.
- Fragments are per language and not interchangeable, even where two languages look alike
- Gremlin literals are single-quoted, so inside one a double quote needs no escaping and a single quote does — see `docs/adr/20260804-single-quoted-gremlin-literals.md`. A test proving a value went through a fragment constructor has to feed a single quote; a double quote passes through either way and proves nothing.
- A SPARQL string literal escapes the full `ECHAR` set and can carry any value, but a SPARQL IRI reference has no escape mechanism, so `fragment.iri(...)` throws `UnescapableValueError` for a value carrying a forbidden character rather than emitting it — see `docs/adr/20260805-sparql-literal-escaping-and-iri-forbidding.md`. The fragment module owns which characters are forbidden; do not percent-encode them, which would name a different resource.
- Match a SPARQL substring with `CONTAINS(LCASE(STR(?var)), LCASE(...))`, never `regex(...)` — a fragment is escaped to be a literal, and inside `regex(...)` that literal's punctuation is read as pattern syntax instead of being matched as typed.
- Conjoin per-item SPARQL conditions (e.g. attribute filters on neighbor expansion) with a separate `FILTER EXISTS` block each, juxtaposed to AND them — never a shared unbound predicate variable, whose `&&` across items is unsatisfiable and whose scan dominates query cost. See `docs/adr/20260806-sparql-attribute-filters-conjoin-via-filter-exists.md`.
- Never emit `hint:` triples (e.g. `hint:joinOrder`): they are a Blazegraph/Neptune extension that silently returns zero rows on other SPARQL 1.1 endpoints Graph Explorer supports.
