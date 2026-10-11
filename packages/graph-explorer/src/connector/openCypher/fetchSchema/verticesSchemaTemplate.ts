import { query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Given a set of node labels, returns an openCypher query that samples one node
 * per label in a single request: a `UNION ALL` of index-scoped blocks. `UNION
 * ALL` (not `UNION`) keeps one row per block — de-duplication would drop a
 * sample shared by two labels.
 *
 * @example
 * verticesSchemaTemplate({ types: ["airport", "country"] })
 * // MATCH (v:`airport`) RETURN v AS object LIMIT 1
 * // UNION ALL
 * // MATCH (v:`country`) RETURN v AS object LIMIT 1
 */
export default function verticesSchemaTemplate({ types }: { types: string[] }) {
  const blocks = types.map(
    type => `MATCH (v:${fragment.identifier(type)}) RETURN v AS object LIMIT 1`,
  );
  return query`${blocks.join("\nUNION ALL\n")}`;
}
