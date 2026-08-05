import type { Branded } from "@/utils";

/**
 * A piece of query text that a template can interpolate without adding
 * delimiters of its own, because the fragment already carries whatever
 * delimiters its position requires.
 *
 * Produced by the per-query-language fragment modules — see
 * `src/connector/<query-language>/fragments.ts`. One language's fragment is not
 * valid in another.
 */
export type QueryFragment = Branded<string, "QueryFragment">;

/**
 * Marks text as a Query Fragment. The single place a fragment is minted, so
 * every construction path is auditable through the fragment modules.
 */
export function toQueryFragment(text: string): QueryFragment {
  return text as QueryFragment;
}

/**
 * The positions within a query whose value type the query language constrains:
 * an entity ID and a SPARQL IRI.
 */
export type FragmentPosition = "IRI" | "id";
