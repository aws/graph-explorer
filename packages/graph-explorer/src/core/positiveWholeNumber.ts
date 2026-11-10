import { z } from "zod";

/** The error for a value that must be a whole number greater than 0. */
export const POSITIVE_WHOLE_NUMBER_MESSAGE =
  "Enter a whole number greater than 0";

/**
 * A whole number greater than 0, such as a neighbor limit or a fetch timeout.
 */
export const positiveWholeNumberSchema = z
  .number({ error: POSITIVE_WHOLE_NUMBER_MESSAGE })
  .int({ error: POSITIVE_WHOLE_NUMBER_MESSAGE })
  .positive({ error: POSITIVE_WHOLE_NUMBER_MESSAGE });

/** The message to show for the value, or undefined when it is valid. */
export function positiveWholeNumberError(
  value: number | undefined,
): string | undefined {
  return positiveWholeNumberSchema.safeParse(value).error?.issues[0]?.message;
}
