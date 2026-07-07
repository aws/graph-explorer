import { ZodError } from "zod";

import { FileEnvelopeError } from "@/core/fileEnvelope";

import { extractErrorMessage } from "./extractErrorMessage";
import { isCancellationError } from "./isCancellationError";
import { NetworkError } from "./NetworkError";
import { ServerConnectionError } from "./ServerConnectionError";

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

  if (error instanceof ServerConnectionError) {
    if (hasOriginMismatch(error.url)) {
      return {
        title: "Cross-Origin Request Blocked",
        message:
          "The proxy server URL does not match the browser's origin, which can cause CORS errors. Update the connection URL to match the browser's origin.",
      };
    }
    return {
      title: "Connection Error",
      message:
        "Unable to reach the proxy server. This is typically caused by the proxy server not running, an incorrect connection URL, or a CORS configuration issue.",
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
  }

  if (error instanceof NetworkError) {
    if (error.statusCode === 400) {
      return {
        title: "Bad Request",
        message: extractErrorMessage(error.data) ?? defaultDisplayError.message,
      };
    }

    if (error.statusCode === 429) {
      return {
        title: "Too Many Requests",
        message:
          "Requests are currently being throttled. Please try again later.",
      };
    }

    return {
      title: `Network Response ${error.statusCode}`,
      message: extractErrorMessage(error.data) ?? defaultDisplayError.message,
    };
  }

  if (error instanceof FileEnvelopeError) {
    // The message is already written for humans (wrong kind, too new, not JSON).
    return { title: "Invalid file", message: error.message };
  }

  if (error instanceof ZodError) {
    return {
      title: "Unrecognized Result Format",
      message: "The data returned did not match the expected format.",
    };
  }

  return defaultDisplayError;
}

function hasOriginMismatch(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Browsers don't enforce CORS between localhost ports
    if (isLoopback(parsed.hostname) && isLoopback(window.location.hostname)) {
      return false;
    }

    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0"
  );
}
