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
- Constructing the fragment is what makes it safe: `string` escapes the value's full character set, `identifier` applies each language's delimiter rules (Gremlin single-quotes — so a Groovy engine can't interpolate `$`; openCypher backticks with backtick-doubling), and `iri` brackets a SPARQL IRI, rejecting one whose characters the IRI grammar forbids.
- For SPARQL case-insensitive matching use `CONTAINS(LCASE(str(...)), LCASE(fragment.string(term)))`, never `regex(...)`: a fragment is safe as a literal but not as a pattern, so a search term must not reach a pattern position.
- Any fragment constructor can refuse a value it cannot represent — an empty `identifier` in every language, a wrong-typed ID, or a SPARQL `iri` with a forbidden character — by throwing `InvalidFragmentValueError` (construct it via its `unsupportedType`/`emptyIdentifier`/`forbiddenCharacters` factories, which set the `reason`) rather than coercing the value, since silently rewriting it would run a query the user didn't ask for. Let it propagate — `createDisplayError` turns it into a user-facing "this value cannot be used" message.
