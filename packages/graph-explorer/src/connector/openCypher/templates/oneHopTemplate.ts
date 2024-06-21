import dedent from "dedent";
import type { Criterion, NeighborsRequest } from "../../useGEFetchTypes";

const criterionNumberTemplate = ({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string => {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `tgt.${name} = ${value}`;
    case "gt":
    case ">":
      return `tgt.${name} > ${value}`;
    case "gte":
    case ">=":
      return `tgt.${name} >= ${value}`;
    case "lt":
    case "<":
      return `tgt.${name} < ${value}`;
    case "lte":
    case "<=":
      return `tgt.${name} <= ${value}`;
    case "neq":
    case "!=":
      return `tgt.${name} <> ${value}`;
  }
};

const criterionStringTemplate = ({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string => {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `tgt.${name} = "${value}"`;
    case "neq":
    case "!=":
      return `tgt.${name} <> "${value}"`;
    case "like":
      return `tgt.${name} CONTAINS "${value}"`;
  }
};

const criterionDateTemplate = ({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string => {
  switch (operator.toLowerCase()) {
    case "eq":
    case "==":
    default:
      return `tgt.${name} = DateTime("${value}")`;
    case "gt":
    case ">":
      return `tgt.${name} > DateTime("${value}")`;
    case "gte":
    case ">=":
      return `tgt.${name} >= DateTime("${value}")`;
    case "lt":
    case "<":
      return `tgt.${name} < DateTime("${value}")`;
    case "lte":
    case "<=":
      return `tgt.${name} <= DateTime("${value}")`;
    case "neq":
    case "!=":
      return `tgt.${name} <> DateTime("${value}")`;
  }
};

const criterionTemplate = (criterion: Criterion): string => {
  switch (criterion.dataType) {
    case "Number":
      return criterionNumberTemplate(criterion);
    case "Date":
      return criterionDateTemplate(criterion);
    case "String":
    default:
      return criterionStringTemplate(criterion);
  }
};

/**
 * @example
 * sourceId = "124"
 * vertexTypes = ["airport"]
 * edgeTypes = ["route"]
 * limit = 10
 * offset = 0
 *
 * MATCH (v)-[edge:route]->(v:airport)
 * WHERE ID(v) = "124"
 * WITH collect(DISTINCT tgt) AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)}) AS eObjects
 * RETURN vObjects, eObjects
 * SKIP 0
 * LIMIT 10
 */
const oneHopTemplate = ({
  vertexId,
  filterByVertexTypes = [],
  edgeTypes = [],
  filterCriteria = [],
  limit = 0,
  offset = 0,
}: Omit<NeighborsRequest, "vertexType">): string => {
  // List of possible vertex types
  const formattedVertexTypes =
    filterByVertexTypes.length > 1
      ? `(${filterByVertexTypes
          .flatMap(type => type.split("::"))
          .map(type => `v:${type}`)
          .join(" OR ")})`
      : "";
  const formattedEdgeTypes = edgeTypes.map(type => `${type}`).join("|");

  // Specify edge type if provided
  const edgeMatch = edgeTypes.length > 0 ? `e:${formattedEdgeTypes}` : `e`;

  // Specify node type for target if provided and only one
  const targetMatch =
    filterByVertexTypes.length == 1 ? `tgt:${filterByVertexTypes[0]}` : `tgt`;

  // Combine all the WHERE conditions
  const whereConditions = [
    `ID(v) = "${vertexId}"`,
    formattedVertexTypes,
    ...(filterCriteria?.map(criterionTemplate) ?? []),
  ]
    .filter(Boolean)
    .join(" AND ");

  return dedent`
    MATCH (v)-[${edgeMatch}]-(${targetMatch})
    WHERE ${whereConditions}
    WITH DISTINCT v, tgt
    ORDER BY toInteger(ID(tgt))
    ${limit > 0 && offset > 0 ? `SKIP ${offset}` : ``}
    ${limit > 0 ? `LIMIT ${limit}` : ``}
    MATCH (v)-[${edgeMatch}]-(tgt)
    WITH
      collect(DISTINCT tgt) AS vObjects, 
      collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) }) AS eObjects
    RETURN vObjects, eObjects
  `;
};

export default oneHopTemplate;
