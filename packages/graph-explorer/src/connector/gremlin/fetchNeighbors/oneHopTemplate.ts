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
  return query`has(${fragment.identifier(name)},containing(${fragment.string(value)}))`;
}

/**
 * @example
 * sourceId = "124"
 * vertexTypes = ["airport"]
 * attributeFilters = [
 *   { name: "city", value: "Sea" },
 *   { name: "country", value: "ES" }
 * ]
 * excludedVertices = new Set(["256"])
 * limit = 10
 *
 * g.V('124').as('start')
 *   .both()
 *   .hasLabel('airport').and(has('city',containing('Sea')), has('country',containing('ES')))
 *   .filter(__.not(__.hasId('256')))
 *   .dedup()
 *   .range(0, 10)
 *   .as('neighbor')
 *   .project('vertex', 'edges')
 *     .by()
 *     .by(
 *       __.select('start').bothE()
 *         .where(otherV().where(eq('neighbor')))
 *         .dedup().fold()
 *     )
 */
export default function oneHopTemplate({
  vertexId,
  excludedVertices = new Set(),
  filterByVertexTypes = [],
  attributeFilters = [],
  limit = 0,
}: Omit<NeighborsRequest, "vertexTypes">): QueryFragment {
  const idTemplate = fragment.id(vertexId);
  const range =
    limit > 0 ? query`.range(0, ${fragment.number(limit)})` : query``;

  const vertexTypesTemplate =
    filterByVertexTypes.length > 0
      ? query`hasLabel(${joinFragments(filterByVertexTypes.map(fragment.identifier), ", ")})`
      : query``;

  const attributeFiltersTemplate =
    attributeFilters.length > 0
      ? query`and(${joinFragments(attributeFilters.map(attributeFilterTemplate), ", ")})`
      : query``;

  const nodeFilters = [vertexTypesTemplate, attributeFiltersTemplate].filter(
    Boolean,
  );

  const nodeFiltersTemplate =
    nodeFilters.length > 0
      ? query`.${joinFragments(nodeFilters, ".")}`
      : query``;

  const excludedList = joinFragments(
    Array.from(excludedVertices).map(fragment.id),
    ",",
  );
  const excludedTemplate = excludedList
    ? query`.filter(__.not(__.hasId(${excludedList})))`
    : query``;

  return query`
    g.V(${idTemplate}).as('start')
      .both()
      ${nodeFiltersTemplate}
      ${excludedTemplate}
      .dedup()
      ${range}
      .as('neighbor')
      .project('vertex', 'edges')
        .by()
        .by(
          __.select('start').bothE()
            .where(otherV().where(eq('neighbor')))
            .dedup().fold()
        )
  `;
}
