import type { Criterion, NeighborsRequest } from "../../AbstractConnector";

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
 * MATCH (source {id: "124"})-[edge:route]->(v:airport)
 * WHERE v:airport AND NOT (v)-[:route]->() AND NOT ()-[:route]->(v)
 * RETURN DISTINCT v.id as vertexId, edge.id as edgeId
 * LIMIT 10
 * OFFSET 0
 */
const oneHopTemplate = ({
    vertexId,
    filterByVertexTypes = [],
    edgeTypes = [],
    filterCriteria = [],
    limit = 10,
    offset = 0,
  }: Omit<NeighborsRequest, "vertexType">): string => {
    const range = `SKIP ${offset} LIMIT ${limit}`;
    let template = `MATCH (v)`;
  
    const formattedVertexTypes = filterByVertexTypes
      .flatMap(type => type.split("::"))
      .map(type => `${type}`)
      .join("|");
    const formattedEdgeTypes = edgeTypes.map(type => `${type}`).join("|");

    if (edgeTypes.length > 0) {
        template += `-[e:${formattedEdgeTypes}]-`;
    } else {
        template += `-[e]-`;
    }
    
    if (filterByVertexTypes.length > 0) {
        template += `(tgt:${formattedVertexTypes}) `;
    } else {
        template += `(tgt) `;
    }

    template += `WHERE id(v) = ${vertexId} `
  
    let filterCriteriaTemplate = filterCriteria?.map(criterionTemplate).join(" AND ");
    if (filterCriteriaTemplate) {
      template += `AND ${filterCriteriaTemplate} `;
    }

    template += `WITH collect(DISTINCT v) AS vertices, collect(DISTINCT e) AS edges ${range} RETURN vertices, edges`;
  
    return template;
  };

export default oneHopTemplate;
