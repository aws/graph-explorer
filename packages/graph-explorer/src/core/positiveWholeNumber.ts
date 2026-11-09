import { z } from "zod";

import { digitStringSchema } from "@/utils";

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

/**
 * A stored whole number greater than 0, such as a connection override or the
 * default neighbor expansion limit, or absent when the stored value is missing
 * or is not one. Accepts the digit string an older version may have written.
 */
export const storedPositiveWholeNumberSchema = z
  .union([z.number(), digitStringSchema])
  .pipe(positiveWholeNumberSchema)
  .optional()
  .catch(undefined);

/** The message to show for the value, or undefined when it is valid. */
export function positiveWholeNumberError(
  value: number | undefined,
): string | undefined {
  return positiveWholeNumberSchema.safeParse(value).error?.issues[0]?.message;
}
