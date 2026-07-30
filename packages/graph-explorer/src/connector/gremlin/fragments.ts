import { type EdgeId, getRawId, type VertexId } from "@/core";

import { type QueryFragment, toQueryFragment } from "../queryFragment";

/*
 * Constructs Query Fragments for Gremlin. A fragment is safe to interpolate
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
  /** A Gremlin string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(`"${escape(value)}"`);
  },

  /**
   * A property key or label. Gremlin takes these as string literals, so they
   * use the same delimiters and escaping as any other literal.
   *
   * Of the two behaviors present in the templates this replaces, this adopts
   * the escaping one used by the edge connections template.
   */
  identifier(name: string): QueryFragment {
    return toQueryFragment(`"${escape(name)}"`);
  },

  /**
   * An entity ID. A numeric ID takes the Gremlin long suffix and therefore
   * needs no delimiters.
   */
  id(entityId: VertexId | EdgeId): QueryFragment {
    const rawId = getRawId(entityId);
    return toQueryFragment(
      typeof rawId === "number" ? `${rawId}L` : `"${rawId}"`,
    );
  },
};
