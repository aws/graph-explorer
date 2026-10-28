import type { RequestHandler } from "express";

import { RejectedRequestBodyError } from "./errors.ts";

const UNPARSEABLE_BODY_MESSAGE = "Request body could not be parsed";

/**
 * Wraps a body parser so that any error it reports becomes a
 * {@link RejectedRequestBodyError}. The parser's own error can carry the raw
 * body, which would reach the logs and the response.
 */
export function rejectUnreadableBody(parser: RequestHandler): RequestHandler {
  return (request, response, next) => {
    parser(request, response, error => {
      next(error ? toRejectedRequestBodyError(error) : undefined);
    });
  };
}

/**
 * Keeps the parser's status and `type`. A parse failure carries the raw body
 * and its message quotes part of it, so it gets a fixed message; the other
 * parser messages are fixed text.
 */
function toRejectedRequestBodyError(error: unknown) {
  if (!(error instanceof Error)) {
    return new RejectedRequestBodyError(400, UNPARSEABLE_BODY_MESSAGE);
  }

  const status =
    "status" in error && typeof error.status === "number" ? error.status : 400;
  const type =
    "type" in error && typeof error.type === "string" ? error.type : undefined;
  const message = "body" in error ? UNPARSEABLE_BODY_MESSAGE : error.message;

  return new RejectedRequestBodyError(status, message, type);
}
