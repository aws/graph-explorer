import type { NextFunction, Request, Response } from "express";

import { HttpError } from "./errors.ts";
import { type AppLogger, getRequestLoggerPrefix } from "./logging.ts";

/**
 * Global error handler
 * @param error The error to handle.
 */
export function handleError(error: unknown, logger: AppLogger) {
  logger.error(error);
}

/** List of headers that can be logged safely without accidentally logging sensitive information. */
const HEADER_WHITE_LIST = [
  "host",
  "user-agent",
  "graph-db-connection-url",
  "db-query-logging-enabled",
  "accept",
  "content-type",
  "origin",
];

/**
 * Replaces the username and password of a header value that parses as a URL.
 * Scoped to the header values listed in {@link HEADER_WHITE_LIST}; a value that
 * is not a URL, or a URL without userinfo, is returned unchanged.
 */
function redactUrlCredentials(value: string | undefined) {
  if (value === undefined) {
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (!url.username && !url.password) {
    return value;
  }

  if (url.username) {
    url.username = "REDACTED";
  }
  if (url.password) {
    url.password = "REDACTED";
  }
  return url.href;
}

/** Handles any errors thrown within Express routes. */
export function errorHandlingMiddleware() {
  return (
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    const logger = request.app.locals.logger;
    const errorInfo = extractErrorInfo(error);

    response.status(errorInfo.status);

    response.send({
      error: errorInfo,
    });
    // Log the headers of the request
    logger.error(
      `[${getRequestLoggerPrefix(request)}] Request headers: %s`,
      Object.entries(request.headers)
        .filter(([key]) => HEADER_WHITE_LIST.includes(key.toLowerCase()))
        .map(([key, value]) => {
          const text = Array.isArray(value) ? value.join(", ") : value;
          return `\n\t- ${key}: ${redactUrlCredentials(text)}`;
        })
        .join(""),
    );

    handleError(error, logger);
  };
}

function extractErrorInfo(error: unknown) {
  const defaultErrorMessage = "Internal Server Error";

  if (error instanceof HttpError) {
    return {
      ...error.details,
      status: error.status,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message || defaultErrorMessage,
    };
  }

  return {
    status: 500,
    message: defaultErrorMessage,
    name: "Error",
  };
}
