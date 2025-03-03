import { NextFunction, Request, Response } from "express";
import { getRequestLoggerPrefix, logger } from "./logging.js";

/**
 * Global error handler
 * @param error The error to handle.
 */
export function handleError(error: unknown) {
  // Log the error itself
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
    _next: NextFunction
  ) => {
    const errorInfo = extractErrorInfo(error);

    response.status(errorInfo.status);

    response.send({
      error: errorInfo,
    });
    // Log the headers of the request
    logger.error(
      `[${getRequestLoggerPrefix(request)}] Request headers: %s`,
      Object.entries(request.headers)
        .filter(([key]) => HEADER_WHITE_LIST.includes(key))
        .map(
          ([key, value]) =>
            `\n\t- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`
        )
        .join("")
    );

    handleError(error);
  };
}

function extractErrorInfo(error: unknown) {
  const statusCode = getStatusFromError(error);
  const defaultErrorMessage = "Internal Server Error";

  if (error instanceof Error) {
    return {
      ...error,
      status: statusCode,
      message: error.message || defaultErrorMessage,
    };
  } else {
    return {
      status: statusCode,
      message: defaultErrorMessage,
      name: "Error",
    };
  }
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
