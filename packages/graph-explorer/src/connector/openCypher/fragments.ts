import { type EdgeId, getRawId, type VertexId } from "@/core";

import {
  InvalidFragmentValueError,
  type QueryFragment,
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

function escape(value: string): string {
  return value.includes('"') ? JSON.stringify(value).slice(1, -1) : value;
}

export const fragment = {
  /** An openCypher string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(`"${escape(value)}"`);
  },

  /** A property key or label, delimited by backticks. */
  identifier(name: string): QueryFragment {
    return toQueryFragment(`\`${name}\``);
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
    return toQueryFragment(`"${rawId}"`);
  },
};
