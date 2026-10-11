import type { EdgeId, VertexId } from "@/core";

import { logger, setDifference } from "@/utils";

type EntityIdByLabel = { vertices: VertexId; edges: EdgeId };

/**
 * Logs a warning listing requested entity IDs the database did not return,
 * along with the raw database response.
 */
export function warnMissingIds<Label extends keyof EntityIdByLabel>(
  entityLabel: Label,
  requested: readonly EntityIdByLabel[Label][],
  found: readonly EntityIdByLabel[Label][],
  response: unknown,
): void {
  const missing = setDifference(new Set(requested), new Set(found));
  if (missing.size > 0) {
    logger.warn(`Did not find all requested ${entityLabel}`, {
      requested,
      missing: Array.from(missing),
      response,
    });
  }
}
