import type { EdgeId, VertexId } from "@/core";

import { type QueryFragment, toQueryFragment } from "../queryFragment";
import {
  assertRepresentable,
  UnescapableValueError,
  UnsupportedValueTypeError,
} from "../queryValueError";

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
 * The escape sequence for each character a SPARQL string literal cannot carry
 * verbatim inside the double-quote delimiter: the backslash, the double-quote
 * delimiter, and the four whitespace controls that have a short form.
 *
 * Each key is one character. `ESCAPABLE_PATTERN` is derived from the keys, so
 * the two cannot disagree about which characters get escaped. Both properties
 * are asserted in the tests: a key spanning more than one UTF-16 code unit would
 * contribute only its first unit to the pattern, matching characters it was
 * never meant to.
 *
 * The set is exactly the SPARQL ECHAR escapes reachable in a double-quoted
 * literal. Notably:
 *
 * - The single quote is left bare: it needs no escape inside a double-quoted
 *   literal.
 * - `\uXXXX` is not used. The SPARQL literal grammar has no UCHAR, so a C0
 *   control character without a short form is emitted raw, which every engine
 *   accepts. The whole-query codepoint pre-pass that some tooling applies is
 *   backslash-aware, so escaping the backslash to `\\` is sufficient.
 *
 * Verified live against Neptune 1.2.1.0/1.3.5.0/1.4.7.0.
 */
export const SHORT_ESCAPES = {
  "\\": "\\\\",
  '"': '\\"',
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
} as const;

type EscapableCharacter = keyof typeof SHORT_ESCAPES;

export const ESCAPABLE_PATTERN = new RegExp(
  `[${Object.keys(SHORT_ESCAPES)
    .map(char => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .join("")}]`,
  "g",
);

/**
 * The characters a SPARQL IRI reference cannot carry: the delimiters and
 * grammar-reserved characters, plus every codepoint at or below U+0020 (the
 * control range, which includes the space). An IRI reference has no escape
 * mechanism, so a value carrying any of these is reported rather than emitted —
 * percent-encoding it would name a different resource than the caller asked for.
 */
const FORBIDDEN_IRI_CHARS = new Set([
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

function escapeStringLiteralBody(value: string): string {
  return value.replaceAll(
    ESCAPABLE_PATTERN,
    char => SHORT_ESCAPES[char as EscapableCharacter],
  );
}

function forbiddenIriCharacters(value: string): string[] {
  const offenders: string[] = [];
  for (const char of value) {
    if (FORBIDDEN_IRI_CHARS.has(char) || char <= " ") {
      offenders.push(char);
    }
  }
  return offenders;
}

export const fragment = {
  /** A SPARQL string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    assertRepresentable(value);
    return toQueryFragment(`"${escapeStringLiteralBody(value)}"`);
  },

  /** An IRI reference, delimited by angle brackets. */
  iri(value: VertexId | EdgeId | string): QueryFragment {
    if (typeof value !== "string") {
      throw new UnsupportedValueTypeError("sparql", "IRI", value);
    }
    assertRepresentable(value);
    const offenders = forbiddenIriCharacters(value);
    if (offenders.length > 0) {
      throw new UnescapableValueError("sparql", "IRI", value, offenders);
    }
    return toQueryFragment(`<${value}>`);
  },
};
