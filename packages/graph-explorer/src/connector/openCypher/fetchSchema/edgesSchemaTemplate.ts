import { query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Given a set of edge types, returns an openCypher query that samples one edge
 * per type in a single request: a `UNION ALL` of type-scoped blocks. The match
 * is directed (`-[e]->`) so each type is scanned once; an undirected `-[e]-`
 * would scan both directions and add a self-loop filter for the same sample.
 *
 * @example
 * edgesSchemaTemplate({ types: ["route", "contains"] })
 * // MATCH () -[e:`route`]-> () RETURN e AS object LIMIT 1
 * // UNION ALL
 * // MATCH () -[e:`contains`]-> () RETURN e AS object LIMIT 1
 */
export default function edgesSchemaTemplate({ types }: { types: string[] }) {
  const blocks = types.map(
    type =>
      `MATCH () -[e:${fragment.identifier(type)}]-> () RETURN e AS object LIMIT 1`,
  );
  return query`${blocks.join("\nUNION ALL\n")}`;
}
