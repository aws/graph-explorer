import { ZodError } from "zod";

import { NetworkError } from "./NetworkError";

export type ErrorDetails = {
  name: string;
  message: string;
  data?: string;
};

/** Extracts a name and message from an unknown error for display in error detail dialogs. */
export function createErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof NetworkError) {
    const name = error.statusText
      ? `${error.statusCode} ${error.statusText}`
      : `${error.statusCode}`;
    const data =
      error.data != null ? JSON.stringify(error.data, null, 2) : undefined;
    return { name, message: error.message, ...(data && { data }) };
  }
  if (error instanceof ZodError) {
    return {
      name: "ZodError",
      message: error.message,
      data: JSON.stringify(error.issues, null, 2),
    };
  }
  if (Error.isError(error)) {
    const data = error.cause
      ? JSON.stringify(serializeCause(error.cause), null, 2)
      : undefined;
    return { name: error.name, message: error.message, ...(data && { data }) };
  }
  return { name: "Unknown Error", message: JSON.stringify(error, null, 2) };
}

const EXCLUDED_ERROR_PROPERTIES = new Set(["stack", "cause"]);

function serializeCause(cause: unknown): unknown {
  if (Error.isError(cause)) {
    const result: Record<string, unknown> = { name: cause.name };
    for (const key of Object.getOwnPropertyNames(cause)) {
      if (!EXCLUDED_ERROR_PROPERTIES.has(key)) {
        result[key] = cause[key as keyof typeof cause];
      }
    }
    if (cause.cause) {
      result.cause = serializeCause(cause.cause);
    }
    return result;
  }
  return cause;
}
