import type { z } from "zod";

import { fromError } from "zod-validation-error";

/**
 * Builds the exact `fromError` `ValidationError` that a function would throw
 * when `schema.safeParse(data)` fails. Use with `.toThrow()` or
 * `.rejects.toThrow()` to assert the full error instance, not just a message.
 */
export function validationErrorFor<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    throw new Error("Expected schema to fail for this data");
  }
  return fromError(parsed.error);
}
