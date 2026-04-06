import { z } from "zod";

/** Thrown when request validation via Zod fails. Carries the original ZodError. */
export class RequestValidationError extends Error {
  readonly zodError: z.core.$ZodError;

  constructor(zodError: z.core.$ZodError) {
    super(z.prettifyError(zodError));
    this.name = "RequestValidationError";
    this.zodError = zodError;
  }
}
