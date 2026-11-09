import { z } from "zod";

const NEIGHBOR_LIMIT_MESSAGE = "Enter a whole number greater than 0";

/** The most neighbors one expansion may fetch: a whole number greater than 0. */
export const neighborLimitSchema = z
  .number({ error: NEIGHBOR_LIMIT_MESSAGE })
  .int({ error: NEIGHBOR_LIMIT_MESSAGE })
  .positive({ error: NEIGHBOR_LIMIT_MESSAGE });

/** The message to show for a neighbor limit, or undefined when it is valid. */
export function neighborLimitError(
  limit: number | undefined,
): string | undefined {
  return neighborLimitSchema.safeParse(limit).error?.issues[0]?.message;
}
