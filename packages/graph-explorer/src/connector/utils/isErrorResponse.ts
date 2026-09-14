import type { ErrorResponse } from "../useGEFetchTypes";

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return !!(record.code && record.detailedMessage);
}

export default isErrorResponse;
