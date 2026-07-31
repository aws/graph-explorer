import { type EdgeId, getRawId, type VertexId } from "@/core";

import {
  InvalidFragmentValueError,
  type QueryFragment,
  toQueryFragment,
} from "../queryFragment";

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

/**
 * Escapes a value for a Gremlin string literal, delimited by single quotes.
 *
 * Single quotes rather than double quotes because open-source TinkerPop Gremlin
 * Server (and JanusGraph) parse the query as Groovy, where a double-quoted
 * string is a GString: an unescaped `$` begins interpolation (`$name`,
 * `${...}`), so a value containing `$` is not preserved verbatim. Groovy does
 * not interpolate inside single quotes. Neptune (ANTLR grammar) treats `$` as
 * literal in either form but rejects a `\$` escape, so escaping the dollar is
 * not an option that works on both — single quoting keeps `$` literal on every
 * supported engine.
 *
 * `JSON.stringify` gives a correctly escaped double-quoted literal, from which
 * we take the escaped body (dropping the surrounding quotes), then swap to
 * single-quote delimiting: a double quote no longer needs escaping (`\"` → `"`)
 * and a single quote now does (`'` → `\'`). Backslash and control-character
 * escapes (`\\`, `\n`, `\t`, `\uXXXX`) carry over unchanged and are valid in a
 * Groovy single-quoted string. `$` is intentionally left unescaped.
 */
function toStringLiteral(value: string): string {
  const escapedBody = JSON.stringify(value)
    .slice(1, -1)
    .replaceAll('\\"', '"')
    .replaceAll("'", "\\'");
  return `'${escapedBody}'`;
}

export const fragment = {
  /** A Gremlin string literal, including the surrounding single quotes. */
  string(value: string): QueryFragment {
    return toQueryFragment(toStringLiteral(value));
  },

  /**
   * A property key or label. Gremlin takes these as string literals, so they
   * use the same delimiters and escaping as any other literal. An empty name
   * cannot identify anything and is reported rather than emitted.
   */
  identifier(name: string): QueryFragment {
    if (name === "") {
      throw InvalidFragmentValueError.emptyIdentifier("gremlin", "identifier");
    }
    return toQueryFragment(toStringLiteral(name));
  },

  /**
   * An entity ID. A numeric ID takes the Gremlin long suffix and therefore
   * needs no delimiters.
   */
  id(entityId: VertexId | EdgeId): QueryFragment {
    const rawId = getRawId(entityId);
    return toQueryFragment(
      typeof rawId === "number" ? `${rawId}L` : toStringLiteral(rawId),
    );
  },
};
