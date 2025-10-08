import { ScalarValue } from "@/connector/entities";
import { SparqlValue } from "@/connector/sparql/types";

export function createUriValue(value: string): SparqlValue {
  return {
    type: "uri",
    value,
  };
}

export function createBNodeValue(value: string): SparqlValue {
  return {
    type: "bnode",
    value,
  };
}

export function createLiteralValue(
  value: Exclude<ScalarValue, null>
): SparqlValue {
  if (typeof value === "number") {
    return {
      type: "literal",
      value: value.toString(),
      datatype: value.toString().includes(".")
        ? "http://www.w3.org/2001/XMLSchema#decimal"
        : "http://www.w3.org/2001/XMLSchema#integer",
    };
  }

  if (value instanceof Date) {
    return {
      type: "literal",
      value: value.toISOString(),
      datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
    };
  }

  return {
    type: "literal",
    value: value.toString(),
  };
}
