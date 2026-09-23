import { logger, setDifference } from "@/utils";

/**
 * Logs a warning listing requested entity IDs the database did not return.
 */
export function warnMissingIds<T>(
  entityLabel: "edges" | "vertices",
  requested: readonly T[],
  found: readonly T[],
  context: Record<string, unknown>,
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
