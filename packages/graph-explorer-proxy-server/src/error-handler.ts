import type { NextFunction, Request, Response } from "express";

import { RequestValidationError } from "./errors.js";
import { type AppLogger, getRequestLoggerPrefix } from "./logging.js";

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
        .map(
          ([key, value]) =>
            `\n\t- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
        )
        .join(""),
    );

    handleError(error, logger);
  };
}

function extractErrorInfo(error: unknown) {
  const defaultErrorMessage = "Internal Server Error";

  if (error instanceof RequestValidationError) {
    return {
      status: 400,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      ...error,
      status: getStatusFromError(error),
      message: error.message || defaultErrorMessage,
    };
  }

  return {
    status: 500,
    message: defaultErrorMessage,
    name: "Error",
  };
}

function getStatusFromError(error: unknown) {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  return 500;
}
