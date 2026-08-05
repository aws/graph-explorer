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
