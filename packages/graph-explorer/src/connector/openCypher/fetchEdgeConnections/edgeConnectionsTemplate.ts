import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Returns an openCypher query that discovers distinct edge connection patterns
 * for a batch of edge types in a single request.
 *
 * Each edge type contributes one `UNION ALL` block that samples its edges and
 * returns the distinct endpoint label arrays, tagged with a literal `edgeType`
 * column so the caller can regroup the rows by edge type. The per-type block is
 * index-backed on Neptune (the edge type is pushed into the scan) and keeps a
 * per-type `LIMIT` so a high-cardinality type cannot starve the sample of a
 * rare one.
 */
export default function edgeConnectionsTemplate({
  types,
}: {
  types: EdgeType[];
}) {
  return types
    .map(
      type => query`
        MATCH (s)-[e:${fragment.identifier(type)}]->(t)
        WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
        LIMIT ${DEFAULT_SAMPLE_SIZE}
        RETURN DISTINCT ${fragment.string(type)} AS edgeType, sourceLabels, targetLabels
      `,
    )
    .join("\nUNION ALL\n");
}
