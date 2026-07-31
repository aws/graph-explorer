import type { EdgeId, VertexId } from "@/core";

import {
  InvalidFragmentValueError,
  type QueryFragment,
  toQueryFragment,
} from "../queryFragment";

/*
 * Constructs Query Fragments for SPARQL. A fragment is safe to interpolate
 * without the template adding delimiters of its own.
 *
 * These constructors are intentionally per-language rather than shared, even
 * where two languages currently coincide: the delimiters, escaping, and ID
 * rules diverge (openCypher delimits identifiers with backticks, SPARQL has
 * IRIs and no identifiers, Gremlin suffixes numeric IDs with L).
 *
 * SPARQL has no `identifier` constructor: RDF has no bare identifiers, so a
 * predicate or class is an IRI. It has no `id` constructor either, because an
 * entity ID is itself an IRI.
 *
 * Exported as a single object so call sites always read `fragment.string(…)`,
 * `fragment.iri(…)`. The qualifier keeps the invariant visible: the returned
 * text already carries its delimiters, so the template must not add its own.
 */

/**
 * Escapes a value for a SPARQL string literal delimited by double quotes.
 * `JSON.stringify` produces a double-quoted literal whose escapes — `\"`, `\\`,
 * and `\uXXXX` for control characters — are all valid SPARQL string escapes, so
 * the result is a complete literal including its surrounding quotes.
 */
function toStringLiteral(value: string): string {
  return JSON.stringify(value);
}

/**
 * The SPARQL IRIREF grammar forbids these characters between the angle
 * brackets: `<`, `>`, `"`, `{`, `}`, `|`, `^`, backtick, and backslash.
 */
const forbiddenIriChars = new Set([
  "<",
  ">",
  '"',
  "{",
  "}",
  "|",
  "^",
  "`",
  "\\",
]);

/**
 * Reports whether a value cannot appear in a SPARQL IRI reference. Besides the
 * explicitly forbidden characters, the grammar also forbids any character in
 * the control range U+0000–U+0020, which includes the space. An IRI reference
 * is not a quoted context, so none of these can be escaped — a value containing
 * one is reported as unrepresentable rather than emitted.
 */
function hasForbiddenIriChar(value: string): boolean {
  for (const char of value) {
    if (char <= " " || forbiddenIriChars.has(char)) {
      return true;
    }
  }
  return false;
}

export const fragment = {
  /** A SPARQL string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(toStringLiteral(value));
  },

  /** An IRI reference, delimited by angle brackets. */
  iri(value: VertexId | EdgeId | string): QueryFragment {
    if (typeof value !== "string") {
      throw InvalidFragmentValueError.unsupportedType("sparql", "IRI", value);
    }
    if (hasForbiddenIriChar(value)) {
      throw InvalidFragmentValueError.forbiddenCharacters(
        "sparql",
        "IRI",
        value,
      );
    }
    return toQueryFragment(`<${value}>`);
  },
};
