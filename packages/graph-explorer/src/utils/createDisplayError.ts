import { ZodError } from "zod";

import { EdgeConnectionDiscoveryError } from "@/connector/gremlin/fetchEdgeConnections/discoveryError";
import {
  EmptyIdentifierError,
  QueryValueError,
  UnsupportedValueTypeError,
} from "@/connector/queryValueError";
import { FileEnvelopeError } from "@/core/fileEnvelope";

import { DatabaseTimeoutError } from "./DatabaseTimeoutError";
import { extractErrorMessage } from "./extractErrorMessage";
import { FetchTimeoutError } from "./FetchTimeoutError";
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
 * Errno codes that mean DNS never produced an address: no such host, or a
 * temporary resolver failure. They share one message because both point at the
 * hostname.
 */
const UNREACHABLE_HOST_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);

/**
 * Attempts to convert the technicality of errors in to humane
 * friendly errors that are suitable for display.
 *
 * @param error Any thrown error or error response.
 * @returns A `DisplayError` that contains a title and message.
 */
export function createDisplayError(error: any): DisplayError {
  // First, because it already knows more about the failure than any code on the
  // response it wraps: which strategies were tried and what the user can change.
  if (error instanceof EdgeConnectionDiscoveryError) {
    return {
      title: "Could not discover edge connections",
      message: `${error.message} ${error.recovery}`,
    };
  }

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
      UNREACHABLE_HOST_CODES.has(data.code) ||
      UNREACHABLE_HOST_CODES.has(data.cause?.code)
    ) {
      return {
        title: "Database unreachable",
        message:
          "The database hostname could not be resolved. Check the hostname in the connection and try again.",
      };
    }
    // The hostname is the one thing already proven correct, so this cannot
    // reuse the message above.
    if (data.code === "ETIMEDOUT" || data.cause?.code === "ETIMEDOUT") {
      return {
        title: "Database connection timed out",
        message:
          "The database hostname resolved, but nothing answered at that address. Check that a security group or firewall permits the Graph Explorer server, and that the port in the connection is correct.",
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
      data.code === "MemoryLimitExceededException" ||
      data.cause?.code === "MemoryLimitExceededException"
    ) {
      // The query asked for more memory than the instance had, which is a
      // property of the query rather than of the connection.
      return {
        title: "Not enough memory",
        message:
          "The database ran out of memory answering the query. Try a smaller request, or use an instance with more memory.",
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

  if (error instanceof FetchTimeoutError) {
    return {
      title: "Fetch timeout exceeded",
      message: `The request did not finish within this connection's fetch timeout of ${error.timeoutMs.toLocaleString()} ms. Increase the Fetch Timeout in this connection's advanced options, or retry the request.`,
    };
  }

  if (error instanceof DatabaseTimeoutError) {
    return {
      title: "Database query timed out",
      message:
        "The database stopped the query because it ran longer than its query timeout. Increase the query timeout in the database configuration, such as the DB cluster parameter group for Neptune, or retry the request.",
    };
  }

  // Cancellation errors
  if (isCancellationError(error)) {
    return {
      title: "Request cancelled",
      message: "The request was cancelled.",
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

  // Name the offending value in end-user terms; the technical language and
  // position are in the error details dialog.
  if (error instanceof UnsupportedValueTypeError) {
    return {
      title: "This value cannot be used",
      message: `The value "${String(error.value)}" cannot be used in a query against this database.`,
    };
  }

  if (error instanceof EmptyIdentifierError) {
    return {
      title: "This identifier cannot be used",
      message: "An empty identifier cannot be used in a query.",
    };
  }

  // A new failure type degrades to correct-but-generic wording rather than
  // falling through to the misleading "Something went wrong".
  if (error instanceof QueryValueError) {
    return {
      title: "This value cannot be used",
      message: "This value cannot be used in a query against this database.",
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
