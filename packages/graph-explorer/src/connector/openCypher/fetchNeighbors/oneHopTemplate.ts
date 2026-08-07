import type {
  AttributeFilter,
  NeighborsRequest,
} from "@/connector/useGEFetchTypes";

import { query } from "@/utils";

import { fragment } from "../fragments";

const attributeFilterTemplate = ({ name, value }: AttributeFilter): string =>
  `tgt.${fragment.identifier(name)} CONTAINS ${fragment.string(value)}`;

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
const oneHopTemplate = ({
  vertexId,
  filterByVertexTypes = [],
  attributeFilters = [],
  excludedVertices = new Set(),
  limit = 0,
}: Omit<NeighborsRequest, "vertexTypes">): string => {
  const formattedExcludedVertices =
    excludedVertices.size > 0
      ? `NOT ID(tgt) IN [${excludedVertices.values().map(fragment.id).toArray().join(", ")}]`
      : "";

  // List of possible vertex labels when there are multiple (single label is handled elsewhere)
  const formattedVertexTypes =
    filterByVertexTypes.length > 1
      ? `(${filterByVertexTypes
          .map(type => `v:${fragment.identifier(type)}`)
          .join(" OR ")})`
      : "";

  // Specify node type for target if provided and only one
  const targetMatch =
    filterByVertexTypes.length == 1
      ? `tgt:${fragment.identifier(filterByVertexTypes[0])}`
      : `tgt`;

  // Combine all the WHERE conditions
  const whereConditions = [
    `ID(v) = ${fragment.id(vertexId)}`,
    formattedExcludedVertices,
    formattedVertexTypes,
    ...attributeFilters.map(attributeFilterTemplate),
  ]
    .filter(Boolean)
    .join(" AND ");

  if (limit > 0) {
    // When applying a limit, we must apply it to the set of distinct neighbors, which requires some additional steps
    return query`
      MATCH (v)-[e]-(${targetMatch})
      WHERE ${whereConditions}
      WITH DISTINCT v, tgt
      ORDER BY toInteger(ID(tgt))
      LIMIT ${limit}
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
};

export default oneHopTemplate;
