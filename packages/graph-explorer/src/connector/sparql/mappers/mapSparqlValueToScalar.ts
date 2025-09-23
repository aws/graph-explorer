import { ScalarValue } from "@/connector/entities";
import { SparqlValue } from "../types";

/**
 * Converts a SPARQL value to a scalar value that can be used in ResultScalar
 */
export function mapSparqlValueToScalar(sparqlValue: SparqlValue): ScalarValue {
  if (sparqlValue.type !== "literal" || !sparqlValue.datatype) {
    // For URIs and blank nodes or plain literal without datatype, return the value as string
    return sparqlValue.value;
  }

  // Handle typed literals
  switch (sparqlValue.datatype) {
    case "http://www.w3.org/2001/XMLSchema#integer":
    case "http://www.w3.org/2001/XMLSchema#int":
    case "http://www.w3.org/2001/XMLSchema#long":
      return parseInt(sparqlValue.value, 10);

    case "http://www.w3.org/2001/XMLSchema#decimal":
    case "http://www.w3.org/2001/XMLSchema#double":
    case "http://www.w3.org/2001/XMLSchema#float":
      return parseFloat(sparqlValue.value);

    case "http://www.w3.org/2001/XMLSchema#boolean":
      return sparqlValue.value === "true" || sparqlValue.value === "1";

    case "http://www.w3.org/2001/XMLSchema#dateTime":
    case "http://www.w3.org/2001/XMLSchema#date":
      return new Date(sparqlValue.value);

    default:
      // For unknown datatypes, return as string
      return sparqlValue.value;
  }
}
