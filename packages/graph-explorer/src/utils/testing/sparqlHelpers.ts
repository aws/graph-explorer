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
  value: string | number | boolean
): SparqlValue {
  return {
    type: "literal",
    value: value.toString(),
    // Only include the datatype if the value is a number
    ...(typeof value === "number" && {
      datatype: value.toString().includes(".")
        ? "http://www.w3.org/2001/XMLSchema#decimal"
        : "http://www.w3.org/2001/XMLSchema#integer",
    }),
  };
}
