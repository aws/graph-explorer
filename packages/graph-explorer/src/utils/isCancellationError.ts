import { CancelledError } from "@tanstack/react-query";

/**
 * Determines if an error represents a cancellation or abort operation.
 *
 * This function checks if the provided error object indicates that an operation
 * was cancelled or aborted, either through the error's name or message property.
 *
 * @param error - The error object to check for cancellation indicators
 * @returns true if the error represents a cancellation/abort, false otherwise
 */
export function isCancellationError(error: unknown) {
  if (error == null || typeof error !== "object") {
    return false;
  }

  // Check for TanStack Query cancellation error type
  if (error instanceof CancelledError) {
    return true;
  }

  // Check for AbortController cancellation error type
  if (
    "name" in error &&
    typeof error.name === "string" &&
    error.name === "AbortError"
  ) {
    return true;
  }

  return false;
}
