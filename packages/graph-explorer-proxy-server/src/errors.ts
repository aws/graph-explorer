import { z } from "zod";

export class HttpError extends Error {
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

/** Thrown when request validation via Zod fails. Carries the original ZodError. */
export class RequestValidationError extends HttpError {
  readonly zodError: z.core.$ZodError;

  constructor(zodError: z.core.$ZodError) {
    super(400, z.prettifyError(zodError), { zodError });
    this.name = "RequestValidationError";
    this.zodError = zodError;
  }
}
