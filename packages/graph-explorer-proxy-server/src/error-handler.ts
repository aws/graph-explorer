import { NextFunction, Request, Response } from "express";
import { logger } from "./logging.js";

/**
 * Global error handler
 * @param error The error to handle.
 */
export function handleError(error: unknown) {
  // Log the error itself
  logger.error(error);
}

/** Handles any errors thrown within Express routes. */
export function errorHandlingMiddleware() {
  return (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
  ) => {
    const errorInfo = extractErrorInfo(error);

    response.status(errorInfo.status);

    response.send({
      error: errorInfo,
    });

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
