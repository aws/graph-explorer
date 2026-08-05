import type { EdgeId, VertexId } from "@/core";

import { type QueryFragment, toQueryFragment } from "../queryFragment";
import { UnsupportedValueTypeError } from "../queryValueError";

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

function escape(value: string): string {
  return value.includes('"') ? JSON.stringify(value).slice(1, -1) : value;
}

export const fragment = {
  /** A SPARQL string literal, including the surrounding double quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(`"${escape(value)}"`);
  },

  /** An IRI reference, delimited by angle brackets. */
  iri(value: VertexId | EdgeId | string): QueryFragment {
    if (typeof value !== "string") {
      throw new UnsupportedValueTypeError("sparql", "IRI", value);
    }
    return toQueryFragment(`<${value}>`);
  },
};
