import { ZodError } from "zod";

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
import { MissingDatabaseUrlError } from "./MissingDatabaseUrlError";
import { NetworkError } from "./NetworkError";
import { ReverseProxyMisconfiguredError } from "./ReverseProxyMisconfiguredError";
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
        message:
          "The database host answered but refused the connection. Check that the port in the connection is correct and the database is running.",
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
      message: `The request did not finish within this connection's fetch timeout of ${error.timeoutMs.toLocaleString()} ms. Increase the Fetch Timeout in the connection's settings, or retry the request.`,
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
    return {
      title: "Connection Error",
      message:
        "The Graph Explorer server is not reachable from this page. It has usually stopped running, or this tab is stale. Reload the page and try again.",
    };
  }

  if (error instanceof MissingDatabaseUrlError) {
    return {
      title: "Missing Database URL",
      message:
        "This Connection has no database URL. Edit the Connection and enter the database endpoint.",
    };
  }

  if (error instanceof ReverseProxyMisconfiguredError) {
    // The message is already written for the operator who deployed this,
    // naming the missing path segment and the fix.
    return { title: "Reverse Proxy Misconfigured", message: error.message };
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
