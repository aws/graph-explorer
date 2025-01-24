import { EntityIdType } from "@/core";
import { GInt64, JanusID } from "../types";
import { isJanusID } from "./toStringId";

/**
 * This function will detect the type of the id value passed in.
 *
 * This can be useful to optimize database queries.
 *
 * @param id The id value to investigate.
 * @returns Either string or number.
 */
export function detectIdType(id: string | GInt64 | JanusID): EntityIdType {
  if (typeof id === "string") {
    return "string";
  }

  if (isJanusID(id)) {
    return "string";
  }

  return "number";
}
