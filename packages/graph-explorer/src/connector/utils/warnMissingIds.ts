import type { EdgeId, VertexId } from "@/core";

import { logger, setDifference } from "@/utils";

type WarnMissingIdsContext = { data?: unknown; response?: unknown };

/**
 * Logs a warning listing requested entity IDs the database did not return.
 */
export function warnMissingIds<T extends VertexId | EdgeId>(
  entityLabel: "edges" | "vertices",
  requested: readonly T[],
  found: readonly T[],
  context: WarnMissingIdsContext = {},
): void {
  const missing = setDifference(new Set(requested), new Set(found));
  if (missing.size > 0) {
    logger.warn(`Did not find all requested ${entityLabel}`, {
      requested,
      missing: Array.from(missing),
      ...context,
    });
  }
}
