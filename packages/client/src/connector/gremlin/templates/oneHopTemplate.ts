import type { NeighborsRequest, Criterion } from "../../AbstractConnector";

const criterionNumberTemplate = ({
  name,
  operator,
  value,
}: Omit<Criterion, "dataType">): string => {
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
      return `has("${name}","${value}")`;
    case "neq":
    case "!=":
      return `has("${name}",neq("${value}"))`;
    case "like":
      return `has("${name}",containing("${value}"))`;
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
 * g.V("124")
 *  .project("vertices", "edges")
 *  .by(
 *    both().hasLabel("airport").dedup().range(0,10).fold()
 *  )
 *  .by(
 *    bothE("route").dedup().range(0,10).fold()
 *  )
 *
 *  @example
 * sourceId = "124"
 * vertexTypes = ["airport"]
 * filterCriteria = [
 *   { name: "longest", dataType: "Int", operator: "gt", value: 10000 },
 *   { name: "country", dataType: "String", operator: "like", value: "ES" }
 * ]
 * limit = 10
 * offset = 0
 *
 * g.V("124")
 *  .project("vertices", "edges")
 *  .by(
 *    both().hasLabel("airport").and(
 *      has("longest", gt(10000)),
 *      has("country", containing("ES"))
 *    ).dedup().range(0,10).fold()
 *  )
 *  .by(
 *    bothE("route").dedup().range(0,10).fold()
 *  )
 */
const oneHopTemplate = ({
  vertexId,
  vertexTypes = [],
  edgeTypes = [],
  filterCriteria = [],
  limit = 10,
  offset = 0,
}: NeighborsRequest): string => {
  const range = `.range(${offset}, ${offset + limit})`;
  let template = `g.V("${vertexId}").project("vertices", "edges")`;

  const hasLabelContent = vertexTypes
    .flatMap(type => type.split("::"))
    .map(type => `"${type}"`)
    .join(",");
  const bothEContent = edgeTypes.map(type => `"${type}"`).join(",");

  let filterCriteriaTemplate = ".and(";
  filterCriteriaTemplate += filterCriteria?.map(criterionTemplate).join(",");
  filterCriteriaTemplate += ")";

  if (vertexTypes.length > 0) {
    if (filterCriteria.length > 0) {
      template += `.by(both().hasLabel(${hasLabelContent})${filterCriteriaTemplate}.dedup()${range}.fold())`;
    } else {
      template += `.by(both().hasLabel(${hasLabelContent}).dedup()${range}.fold())`;
    }
  } else {
    if (filterCriteria.length > 0) {
      template += `.by(both()${filterCriteriaTemplate}.dedup()${range}.fold())`;
    } else {
      template += `.by(both().dedup()${range}.fold())`;
    }
  }

  if (edgeTypes.length > 0) {
    if (vertexTypes.length > 0) {
      template += `.by(bothE(${bothEContent}).where(otherV().hasLabel(${hasLabelContent})).dedup()${range}.fold())`;
    } else {
      template += `.by(bothE(${bothEContent}).dedup()${range}.fold())`;
    }
  } else {
    if (vertexTypes.length > 0) {
      template += `.by(bothE().where(otherV().hasLabel(${hasLabelContent})).dedup()${range}.fold())`;
    } else {
      template += `.by(bothE().dedup()${range}.fold())`;
    }
  }

  return template;
};

export default oneHopTemplate;
