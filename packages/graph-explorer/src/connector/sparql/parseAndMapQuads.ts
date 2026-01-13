import { fromError } from "zod-validation-error";

import { logger } from "@/utils";

import isErrorResponse from "../utils/isErrorResponse";
import { mapQuadToEntities } from "./mappers/mapQuadToEntities";
import { sparqlResponseSchema, sparqlQuadBindingSchema } from "./types";

/**
 * Checks the data for error information, then parses to SPARQL quad bindings and maps to result entities.
 *
 * @param data - The response from the SPARQL endpoint
 * @returns The parsed and mapped entities
 */
export function parseAndMapQuads(data: unknown) {
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  const parsed = sparqlResponseSchema(sparqlQuadBindingSchema).safeParse(data);
  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse SPARQL JSON response",
      validationError.toString(),
      data,
    );
    throw validationError;
  }

  return mapQuadToEntities(parsed.data.results.bindings);
}
