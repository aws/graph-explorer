import { ZodError } from "zod";

import { isCancellationError } from "./isCancellationError";
import { NetworkError } from "./NetworkError";

export type DisplayError = {
  title: string;
  message: string;
};

const defaultDisplayError: DisplayError = {
  title: "Something went wrong",
  message: "An error occurred. Please try again.",
};

/**
 * Attempts to convert the technicality of errors in to humane
 * friendly errors that are suitable for display.
 *
 * @param error Any thrown error or error response.
 * @returns A `DisplayError` that contains a title and message.
 */
export function createDisplayError(error: any): DisplayError {
  const data =
    error instanceof NetworkError
      ? error.data
      : typeof error === "object"
        ? error
        : null;
  if (data != null) {
    // Bad connection configuration
    if (data.code === "ECONNREFUSED" || data.cause?.code === "ECONNREFUSED") {
      return {
        title: "Connection refused",
        message: "Please check your connection and try again.",
      };
    }
    if (data.code === "ECONNRESET" || data.cause?.code === "ECONNRESET") {
      return {
        title: "Connection reset",
        message: "Please check your connection and try again.",
      };
    }
    if (
      data.code === "ERR_INVALID_URL" ||
      data.cause?.code === "ERR_INVALID_URL"
    ) {
      return {
        title: "Invalid URL",
        message:
          "Please check the database URL in the connection and try again.",
      };
    }
    if (
      data.code === "TimeLimitExceededException" ||
      data.cause?.code === "TimeLimitExceededException"
    ) {
      // Server timeout
      return {
        title: "Deadline exceeded",
        message:
          "Increase the query timeout in the DB cluster parameter group, or retry the request.",
      };
    }

    // Malformed query
    if (
      data.code === "MalformedQueryException" ||
      data.cause?.code === "MalformedQueryException"
    ) {
      return {
        title: "Malformed Query",
        message:
          "The executed query was rejected by the database. It is possible the query structure is not supported by your database.",
      };
    }
  }

  // Cancellation errors
  if (isCancellationError(error)) {
    return {
      title: "Request cancelled",
      message:
        "The request exceeded the configured timeout length or was cancelled by the user.",
    };
  }

  if (error instanceof Error) {
    // Fetch timeout
    if (error.name === "TimeoutError") {
      return {
        title: "Fetch Timeout Exceeded",
        message: "The request exceeded the configured fetch timeout.",
      };
    }

    // Internet issues
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      return {
        title: "Connection Error",
        message: "Please check your connection and try again.",
      };
    }
  }

  if (error instanceof NetworkError) {
    if (error.statusCode === 429) {
      return {
        title: "Too Many Requests",
        message:
          "Requests are currently being throttled. Please try again later.",
      };
    }

    return {
      title: `Network Response ${error.statusCode}`,
      message:
        extractMessageFromData(error.data) ?? defaultDisplayError.message,
    };
  }

  if (error instanceof ZodError) {
    return {
      title: "Unrecognized Result Format",
      message: "The data returned did not match the expected format.",
    };
  }

  return defaultDisplayError;
}

function extractMessageFromData(data: any): string | null {
  if (Boolean(data) === false) {
    return null;
  }
  if (typeof data === "string") {
    return data;
  } else if (typeof data === "object") {
    return data.message ?? data.error ?? null;
  }
  return null;
}
