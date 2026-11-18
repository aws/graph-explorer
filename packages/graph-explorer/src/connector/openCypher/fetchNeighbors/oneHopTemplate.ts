import type { QueryFragment } from "@/connector/queryFragment";
import type {
  AttributeFilter,
  NeighborsRequest,
} from "@/connector/useGEFetchTypes";

import { joinFragments, query } from "@/utils";

import { fragment } from "../fragments";

function attributeFilterTemplate({
  name,
  value,
}: AttributeFilter): QueryFragment {
  return query`tgt.${fragment.identifier(name)} CONTAINS ${fragment.string(value)}`;
}

/**
 * @example
 * sourceId = "124"
 * vertexTypes = ["airport"]
 * limit = 10
 *
 * MATCH (v)-[e]-(tgt:airport)
 * WHERE ID(v) = "124"
 * WITH DISTINCT v, tgt
 * ORDER BY toInteger(ID(tgt))
 * LIMIT 10
 * MATCH (v)-[e]-(tgt)
 * RETURN
 *   collect(DISTINCT tgt) AS vObjects,
 *   collect(e) AS eObjects
 */
function oneHopTemplate({
  vertexId,
  filterByVertexTypes = [],
  attributeFilters = [],
  excludedVertices = new Set(),
  limit = 0,
}: Omit<NeighborsRequest, "vertexTypes">): QueryFragment {
  const formattedExcludedVertices =
    excludedVertices.size > 0
      ? query`NOT ID(tgt) IN [${joinFragments(Array.from(excludedVertices).map(fragment.id), ", ")}]`
      : query``;

  // List of possible vertex labels when there are multiple (single label is handled elsewhere)
  const formattedVertexTypes =
    filterByVertexTypes.length > 1
      ? query`(${joinFragments(
          filterByVertexTypes.map(
            type => query`v:${fragment.identifier(type)}`,
          ),
          " OR ",
        )})`
      : query``;

  // Specify node type for target if provided and only one
  const targetMatch =
    filterByVertexTypes.length == 1
      ? query`tgt:${fragment.identifier(filterByVertexTypes[0])}`
      : query`tgt`;

  // Combine all the WHERE conditions
  const whereConditions = joinFragments(
    [
      query`ID(v) = ${fragment.id(vertexId)}`,
      formattedExcludedVertices,
      formattedVertexTypes,
      ...attributeFilters.map(attributeFilterTemplate),
    ].filter(Boolean),
    " AND ",
  );

  if (limit) {
    // When applying a limit, we must apply it to the set of distinct neighbors, which requires some additional steps
    return query`
      MATCH (v)-[e]-(${targetMatch})
      WHERE ${whereConditions}
      WITH DISTINCT v, tgt
      ORDER BY toInteger(ID(tgt))
      LIMIT ${fragment.number(limit)}
      MATCH (v)-[e]-(tgt)
      RETURN
        collect(DISTINCT tgt) AS vObjects, 
        collect(e) AS eObjects
    `;
  }

  // Much faster and shorter query when no limit is provided
  return query`
    MATCH (v)-[e]-(${targetMatch})
    WHERE ${whereConditions}
    RETURN
      collect(DISTINCT tgt) AS vObjects, 
      collect(e) AS eObjects
  `;
}

export default oneHopTemplate;
