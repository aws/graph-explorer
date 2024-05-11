import { GInt64 } from "../types";

/**
 * This function will detect the type of the id value passed in.
 *
 * This can be useful to optimize database queries.
 *
 * @param id The id value to investigate.
 * @returns Either string or number.
 */
export function detectIdType(id: string | GInt64): "string" | "number" {
  if (typeof id === "string") {
    return "string";
  }

  return "number";
}
