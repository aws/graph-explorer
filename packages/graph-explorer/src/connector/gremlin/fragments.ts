import { type EdgeId, getRawId, type VertexId } from "@/core";

import {
  type QueryFragment,
  toNumberFragment,
  toQueryFragment,
} from "../queryFragment";
import { assertRepresentable, EmptyIdentifierError } from "../queryValueError";

/*
 * Constructs Query Fragments for Gremlin. A fragment is safe to interpolate
 * without the template adding delimiters of its own.
 *
 * These constructors are intentionally per-language rather than shared, even
 * where two languages currently coincide: the delimiters, escaping, and ID
 * rules diverge (openCypher delimits identifiers with backticks, SPARQL has
 * IRIs and no identifiers, Gremlin suffixes numeric IDs with L).
 *
 * `number` is the exception: a plain decimal reads the same in every language,
 * so it delegates to the shared `toNumberFragment`.
 *
 * Exported as a single object so call sites always read `fragment.string(…)`,
 * `fragment.identifier(…)`, etc. The qualifier keeps the invariant visible: the
 * returned text already carries its delimiters, so the template must not add
 * its own.
 */

/**
 * The escape sequence for each character a Gremlin string literal cannot carry
 * verbatim: the backslash, the single-quote delimiter, and the five whitespace
 * controls that have a short form.
 *
 * Each key is one character. `ESCAPABLE_PATTERN` is derived from the keys, so
 * the two cannot disagree about which characters get escaped. Both properties
 * are asserted in the tests: a key spanning more than one UTF-16 code unit would
 * contribute only its first unit to the pattern, matching characters it was
 * never meant to.
 *
 * The set is the intersection of what every supported engine accepts, and it is
 * deliberately no larger — two engines parse the query text differently, Neptune
 * with an ANTLR grammar and open-source Apache TinkerPop Gremlin Server and
 * JanusGraph as Groovy. Notably:
 *
 * - `\uXXXX` is not used: Groovy 2.5 (TinkerPop 3.6.2) resolves unicode escapes
 *   at the source level before lexing, so a `\` at a literal's edge would
 *   decode to a backslash and break out of the string. C0 control characters
 *   without a short form are emitted raw instead, which every engine accepts.
 * - A raw newline or carriage return is rejected by the Groovy lexer, so both
 *   take their short escape rather than passing through.
 * - A double quote needs no escape inside a single-quoted literal, and `$` is
 *   left alone because a `\$` escape is a parse error on Neptune. Keeping `$`
 *   verbatim is what the delimiter choice buys — see the ADR.
 *
 * Verified live against Neptune 1.2.1.0/1.4.7.0 and Gremlin Server 3.6.2/3.8.
 */
export const SHORT_ESCAPES = {
  "\\": "\\\\",
  "'": "\\'",
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

function escapeStringLiteralBody(value: string): string {
  return value.replaceAll(
    ESCAPABLE_PATTERN,
    char => SHORT_ESCAPES[char as EscapableCharacter],
  );
}

export const fragment = {
  /** A Gremlin string literal, including the surrounding single quotes. */
  string(value: string): QueryFragment {
    assertRepresentable(value);
    return toQueryFragment(`'${escapeStringLiteralBody(value)}'`);
  },

  /**
   * A property key or label. Gremlin takes these as string literals, so they
   * use the same delimiters and escaping as any other literal.
   */
  identifier(name: string): QueryFragment {
    assertRepresentable(name);
    if (name === "") {
      throw new EmptyIdentifierError("gremlin");
    }
    return toQueryFragment(`'${escapeStringLiteralBody(name)}'`);
  },

  /** A numeric operand, emitted as a plain decimal. */
  number(value: number): QueryFragment {
    return toNumberFragment(value);
  },

  /**
   * An entity ID. A numeric ID takes the Gremlin long suffix and therefore
   * needs no delimiters; a string ID is a string literal like any other.
   */
  id(entityId: VertexId | EdgeId): QueryFragment {
    const rawId = getRawId(entityId);
    if (typeof rawId === "number") {
      return toQueryFragment(`${rawId}L`);
    }
    assertRepresentable(rawId);
    return toQueryFragment(`'${escapeStringLiteralBody(rawId)}'`);
  },
};
