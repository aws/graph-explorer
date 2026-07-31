import type {
  AttributeFilter,
  NeighborsRequest,
} from "@/connector/useGEFetchTypes";

import { query } from "@/utils";

import { fragment } from "../fragments";

function attributeFilterTemplate({ name, value }: AttributeFilter): string {
  return `has(${fragment.identifier(name)},containing(${fragment.string(value)}))`;
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
}: Omit<NeighborsRequest, "vertexTypes">): string {
  const idTemplate = fragment.id(vertexId);
  const range = limit > 0 ? `.range(0, ${limit})` : "";

  const vertexTypes = filterByVertexTypes.flatMap(type => type.split("::"));
  const vertexTypesTemplate =
    vertexTypes.length > 0
      ? `hasLabel(${vertexTypes.map(type => fragment.identifier(type)).join(", ")})`
      : ``;

  const attributeFiltersTemplate =
    attributeFilters.length > 0
      ? `and(${attributeFilters.map(attributeFilterTemplate).join(", ")})`
      : ``;

  const nodeFilters = [vertexTypesTemplate, attributeFiltersTemplate].filter(
    Boolean,
  );

  const nodeFiltersTemplate =
    nodeFilters.length > 0 ? `.${nodeFilters.join(".")}` : ``;

  const excludedList = excludedVertices
    .values()
    .map(fragment.id)
    .toArray()
    .join(",");
  const excludedTemplate = excludedList
    ? `.filter(__.not(__.hasId(${excludedList})))`
    : ``;

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
