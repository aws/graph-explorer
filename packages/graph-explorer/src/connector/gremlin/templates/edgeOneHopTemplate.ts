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
      g.V("125")
      .project("vertices", "edges")
      .by(
        bothE({edgeType})
        .has({filterCriteria K}, {filterCriteria V]})
        .inV().hasLabel({hasLabelContent})
      ).dedup().fold()
 * 
 */

const edgeOneHopTemplate = ({
    vertexId,
    filterByVertexTypes= [],
    edgeTypes = [],
    filterCriteria = [],
    limit = 10,
    offset = 0,
    idType = "string",
  }: Omit<NeighborsRequest, "vertexType"> & {
    idType?: "string" | "number";
  }): string => {
    const range = `.range(${offset}, ${offset + limit})`;
    let template = "";
    if (idType === "number") {
      template = `g.V(${vertexId}L)`;
    } else {
      template = `g.V("${vertexId}")`;
    }

    template += `.project("vertices", "edges")`;

    const bothEContent = edgeTypes.map(type => `"${type}"`).join(",");

    let filterCriteriaTemplate = ".and(";
    filterCriteriaTemplate += filterCriteria?.map(criterionTemplate).join(",");
    filterCriteriaTemplate += ")";

    const hasLabelContent = filterByVertexTypes
    .flatMap(type => type.split("::"))
    .map(type => `"${type}"`)
    .join(",");

      if (edgeTypes.length > 0){
        if (filterCriteria.length > 0) {
            template += `.by(bothE(${bothEContent})${filterCriteriaTemplate}.inV().hasLabel(${hasLabelContent})).dedup()${range}.fold())`;
          } else {
            template += `.by(bothE(${bothEContent}).dedup()${range}.fold())`;
        }
      } else {
        if (filterCriteria.length > 0) {
          template += `.by(bothE(${bothEContent})${filterCriteriaTemplate}.dedup().fold())`;
        } else {
          template += `.by(bothE().dedup().fold())`;
        }
      }
      
      return template;
};
    
export default edgeOneHopTemplate;