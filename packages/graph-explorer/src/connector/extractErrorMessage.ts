/** Attempts to extract a human-readable message from an unknown error body. */
export function extractErrorMessage(error: unknown): string | undefined {
  if (typeof error === "string") {
    return error;
  }
  if (error != null && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["detailedMessage", "message", "description", "error"]) {
      if (typeof record[key] === "string" && record[key].length > 0) {
        return record[key];
      }
    }
  }
  return undefined;
}
