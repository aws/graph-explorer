import { EntityPropertyValue } from "@/core";
import { SparqlValue } from "../types";

export function mapAttributeValue(value: SparqlValue): EntityPropertyValue {
  if (value.type === "literal") {
    if (value.datatype === "http://www.w3.org/2001/XMLSchema#integer") {
      return parseInt(value.value);
    }
    if (value.datatype === "http://www.w3.org/2001/XMLSchema#decimal") {
      return parseFloat(value.value);
    }
    return value.value;
  }
  return value.value;
}
