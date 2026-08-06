import { type EdgeId, getRawId, type VertexId } from "@/core";

import { type QueryFragment, toQueryFragment } from "../queryFragment";
import {
  assertRepresentable,
  EmptyIdentifierError,
  UnescapableValueError,
  UnsupportedValueTypeError,
} from "../queryValueError";

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

function controlCharacters(name: string): string[] {
  const offenders: string[] = [];
  for (const char of name) {
    if (char < " ") {
      offenders.push(char);
    }
  }
  return offenders;
}

export const fragment = {
  /**
   * An openCypher string literal, including the surrounding double quotes.
   * `JSON.stringify` produces a double-quoted literal whose escapes — `\"`,
   * `\\`, the shorthand control escapes (`\n`, `\t`, `\r`, `\b`, `\f`), and
   * `\uXXXX` for any other control character — are all valid Cypher escapes.
   */
  string(value: string): QueryFragment {
    assertRepresentable(value);
    return toQueryFragment(JSON.stringify(value));
  },

  /**
   * A property key or label, delimited by backticks. An embedded backtick is
   * doubled — how openCypher escapes it within a backtick-quoted name. An empty
   * name names nothing and is reported. A control character is reported rather
   * than emitted: a control character in a label is malformed data, and a
   * backtick-quoted name spanning lines is unreadable in the assembled query.
   */
  identifier(name: string): QueryFragment {
    assertRepresentable(name);
    if (name === "") {
      throw new EmptyIdentifierError("openCypher");
    }
    const offenders = controlCharacters(name);
    if (offenders.length > 0) {
      throw new UnescapableValueError(
        "openCypher",
        "identifier",
        name,
        offenders,
      );
    }
    return toQueryFragment(`\`${name.replaceAll("`", "``")}\``);
  },

  /** An entity ID. openCypher only supports string IDs. */
  id(entityId: VertexId | EdgeId): QueryFragment {
    const rawId = getRawId(entityId);
    if (typeof rawId !== "string") {
      throw new UnsupportedValueTypeError("openCypher", "id", rawId);
    }
    return fragment.string(rawId);
  },
};
