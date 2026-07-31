import { type EdgeId, getRawId, type VertexId } from "@/core";

import {
  InvalidFragmentValueError,
  type QueryFragment,
  toFiniteNumber,
  toQueryFragment,
} from "../queryFragment";

/*
 * Constructs Query Fragments for openCypher. A fragment is safe to interpolate
 * without the template adding delimiters of its own.
 *
 * These constructors are intentionally per-language rather than shared, even
 * where two languages currently coincide: the delimiters, escaping, and ID
 * rules diverge (openCypher delimits identifiers with backticks, SPARQL has
 * IRIs and no identifiers, Gremlin suffixes numeric IDs with L).
 *
 * Exported as a single object so call sites always read `fragment.string(…)`,
 * `fragment.identifier(…)`, etc. The qualifier keeps the invariant visible: the
 * returned text already carries its delimiters, so the template must not add
 * its own.
 */

/**
 * Escapes a value for an openCypher double-quoted string literal.
 * `JSON.stringify` produces a double-quoted literal whose escapes — `\"`, `\\`,
 * and `\uXXXX` for control characters — are all valid Cypher string escapes, so
 * the result is a complete literal including its surrounding quotes.
 */
function toStringLiteral(value: string): string {
  return JSON.stringify(value);
}

/**
 * Reports whether a value contains a character in the U+0000–U+0020 control
 * range, which includes the space, tab, and newline.
 */
function hasControlChar(value: string): boolean {
  for (const char of value) {
    if (char < " ") {
      return true;
    }
  }
  return false;
}

export const fragment = {
  /** An openCypher string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(toStringLiteral(value));
  },

  /**
   * A property key or label, delimited by backticks. An embedded backtick is
   * doubled, which is how openCypher escapes it within a backtick-quoted name.
   * An empty name cannot identify anything and is reported rather than emitted.
   *
   * A control character is reported rather than emitted. A backtick-quoted name
   * is the one position that can carry raw whitespace into query text, and the
   * `query` tag then strips trailing whitespace and blank lines from the
   * assembled query — which would silently rewrite the name and address a
   * different attribute than the caller asked for.
   */
  identifier(name: string): QueryFragment {
    if (name === "") {
      throw InvalidFragmentValueError.emptyIdentifier(
        "openCypher",
        "identifier",
      );
    }
    if (hasControlChar(name)) {
      throw InvalidFragmentValueError.forbiddenCharacters(
        "openCypher",
        "identifier",
        name,
      );
    }
    return toQueryFragment(`\`${name.replaceAll("`", "``")}\``);
  },

  /**
   * A numeric comparison operand, emitted without delimiters so the database
   * compares it as a number rather than as text. The value is validated rather
   * than quoted: a non-numeric value cannot be represented here, and quoting it
   * would silently turn a numeric comparison into a string one.
   */
  number(value: unknown): QueryFragment {
    const asNumber = toFiniteNumber(value);
    if (asNumber === undefined) {
      throw InvalidFragmentValueError.unsupportedType(
        "openCypher",
        "value",
        value,
      );
    }
    return toQueryFragment(String(asNumber));
  },

  /** An entity ID. openCypher only supports string IDs. */
  id(entityId: VertexId | EdgeId): QueryFragment {
    const rawId = getRawId(entityId);
    if (typeof rawId !== "string") {
      throw InvalidFragmentValueError.unsupportedType(
        "openCypher",
        "id",
        rawId,
      );
    }
    return toQueryFragment(toStringLiteral(rawId));
  },
};
