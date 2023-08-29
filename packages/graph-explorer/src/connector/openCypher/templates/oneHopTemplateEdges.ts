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
 * MATCH (v)-[edge:route]->(v:airport)
 * WHERE ID(v) = "124"
 * WITH collect(DISTINCT tgt) AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)}) AS eObjects 
 * RETURN vObjects, eObjects 
 * SKIP 0
 * LIMIT 10
 */
const oneHopTemplateEdges = ({
    vertexId,
    filterByVertexTypes = [],
    edgeTypes = [],
    filterCriteria = [],
    limit = 10,
    offset = 0,
    edgeIds = [],
  }: Omit<NeighborsRequest, "vertexType"> & {edgeIds: string[] | undefined;}): string => {
    let template = `MATCH (v)`;
  
    const formattedVertexTypes = filterByVertexTypes
      .flatMap(type => type.split("::"))
      .map(type => `v:${type}`)
      .join(" OR ");
    const formattedEdgeTypes = edgeTypes.map(type => `${type}`).join("|");
    const formattedEdgeIds = edgeIds.map(id => `\"${id}\"`).join(",");

    if (edgeTypes.length > 0) {
        template += `-[e:${formattedEdgeTypes}]-`;
    } else {
        template += `-[e]-`;
    }
    
    if (filterByVertexTypes.length == 1) {
      template += `(tgt:${filterByVertexTypes[0]}) WHERE ID(v) = \"${vertexId}\" AND ID(e) IN [${formattedEdgeIds}] `;
    } else if (filterByVertexTypes.length > 1) {
      template += `(tgt) WHERE ID(v) = \"${vertexId}\" AND ${formattedVertexTypes} AND ID(e) IN [${formattedEdgeIds}] `;
    } else {
      template += `(tgt) WHERE ID(v) = \"${vertexId}\" AND ID(e) IN [${formattedEdgeIds}] `;
    }
  
    let filterCriteriaTemplate = filterCriteria?.map(criterionTemplate).join(" AND ");
    if (filterCriteriaTemplate) {
      template += `AND ${filterCriteriaTemplate} `;
    }

    template += `WITH collect(DISTINCT tgt)[..${limit}] AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)})[..${limit}] AS eObjects RETURN vObjects, eObjects`;
  
    return template;
  };

export default oneHopTemplateEdges;
