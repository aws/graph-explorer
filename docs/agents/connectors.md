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
- In SPARQL, conjoin per-item conditions by giving each item its own `FILTER EXISTS` block. Sharing one triple pattern with an unbound predicate variable (`?neighbor ?p ?o`) makes a conjunction unsatisfiable, because one `?p` cannot equal two IRIs, and that unbound pattern is also the dominant query cost. See `docs/adr/20260804-sparql-attribute-filters-conjoin-via-filter-exists.md`
- Never emit Blazegraph/Neptune `hint:` triples. Other SPARQL 1.1 engines treat a hint as an ordinary triple pattern, match nothing, and return zero rows with no error
