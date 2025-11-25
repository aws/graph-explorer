import { query } from "@/utils";
import type { Criterion, NeighborsRequest } from "@/connector/useGEFetchTypes";
import { idParam } from "../idParam";

function criterionNumberTemplate({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `has("${name}",eq(${value}))`;
    case "gt":
    case ">":
      return `has("${name}",gt(${value}))`;
    case "gte":
    case ">=":
      return `has("${name}",gte(${value}))`;
    case "lt":
    case "<":
      return `has("${name}",lt(${value}))`;
    case "lte":
    case "<=":
      return `has("${name}",lte(${value}))`;
    case "neq":
    case "!=":
      return `has("${name}",neq(${value}))`;
  }
}

function criterionStringTemplate({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `has("${name}","${value}")`;
    case "neq":
    case "!=":
      return `has("${name}",neq("${value}"))`;
    case "like":
      return `has("${name}",containing("${value}"))`;
  }
}

function criterionDateTemplate({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `has("${name}",eq(datetime(${value})))`;
    case "gt":
    case ">":
      return `has("${name}",gt(datetime(${value})))`;
    case "gte":
    case ">=":
      return `has("${name}",gte(datetime(${value})))`;
    case "lt":
    case "<":
      return `has("${name}",lt(datetime(${value})))`;
    case "lte":
    case "<=":
      return `has("${name}",lte(datetime(${value})))`;
    case "neq":
    case "!=":
      return `has("${name}",neq(datetime(${value})))`;
  }
}

function criterionTemplate(criterion: Criterion): string {
  switch (criterion.dataType) {
    case "Number":
      return criterionNumberTemplate(criterion);
    case "Date":
      return criterionDateTemplate(criterion);
    case "String":
    case undefined:
    default:
      return criterionStringTemplate(criterion);
  }
}

/**
 * @example
 * sourceId = "124"
 * vertexTypes = ["airport"]
 * filterCriteria = [
 *   { name: "longest", dataType: "Int", operator: "gt", value: 10000 },
 *   { name: "country", dataType: "String", operator: "like", value: "ES" }
 * ]
 * excludedVertices = new Set(["256"])
 * limit = 10
 *
 * g.V("124").as("start")
 *   .both()
 *   .hasLabel("airport").and(has("longest",gt(10000)), has("country",containing("ES")))
 *   .filter(__.not(__.hasId("256")))
 *   .dedup()
 *   .range(0, 10)
 *   .as("neighbor")
 *   .project("vertex", "edges")
 *     .by()
 *     .by(
 *       __.select("start").bothE()
 *         .where(otherV().where(eq("neighbor")))
 *         .dedup().fold()
 *     )
 */
export default function oneHopTemplate({
  vertexId,
  excludedVertices = new Set(),
  filterByVertexTypes = [],
  filterCriteria = [],
  limit = 0,
}: Omit<NeighborsRequest, "vertexTypes">): string {
  const idTemplate = idParam(vertexId);
  const range = limit > 0 ? `.range(0, ${limit})` : "";

  const vertexTypes = filterByVertexTypes.flatMap(type => type.split("::"));
  const vertexTypesTemplate =
    vertexTypes.length > 0
      ? `hasLabel(${vertexTypes.map(type => `"${type}"`).join(", ")})`
      : ``;

  const filterCriteriaTemplate =
    filterCriteria.length > 0
      ? `and(${filterCriteria.map(criterionTemplate).join(", ")})`
      : ``;

  const nodeFilters = [vertexTypesTemplate, filterCriteriaTemplate].filter(
    Boolean,
  );

  const nodeFiltersTemplate =
    nodeFilters.length > 0 ? `.${nodeFilters.join(".")}` : ``;

  const excludedList = excludedVertices
    .values()
    .map(id => idParam(id))
    .toArray()
    .join(",");
  const excludedTemplate = excludedList
    ? `.filter(__.not(__.hasId(${excludedList})))`
    : ``;

  return query`
    g.V(${idTemplate}).as("start")
      .both()
      ${nodeFiltersTemplate}
      ${excludedTemplate}
      .dedup()
      ${range}
      .as("neighbor")
      .project("vertex", "edges")
        .by()
        .by(
          __.select("start").bothE()
            .where(otherV().where(eq("neighbor")))
            .dedup().fold()
        )
  `;
}
