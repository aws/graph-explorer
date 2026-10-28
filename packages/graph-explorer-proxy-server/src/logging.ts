import type { NextFunction, Request, Response } from "express";
import type { PrettyOptions } from "pino-pretty";

import { type LevelWithSilent, pino } from "pino";

import type { EnvironmentValues } from "./env.ts";

export type LogLevel = LevelWithSilent;

/** Create a logger instance with pino. */
export function createLogger(env: EnvironmentValues) {
  // Check whether we are configured with CloudWatch style
  const loggingInCloudWatch = env.LOG_STYLE === "cloudwatch";
  const options: PrettyOptions = loggingInCloudWatch
    ? {
        // Avoid colors
        colorize: false,
        // Timestamp is handled by CloudWatch, and hostname/pid are not important
        ignore: "time,hostname,pid",
      }
    : {
        colorize: true,
        translateTime: true,
      };

  return pino({
    level: env.LOG_LEVEL,
    transport: {
      target: "pino-pretty",
      options,
    },
  });
}

export type AppLogger = ReturnType<typeof createLogger>;

/** Chooses an log level appropriate for the given status code. */
function logLevelFromStatusCode(statusCode: number) {
  if (statusCode >= 400 && statusCode < 500) {
    return "warn";
  } else if (statusCode >= 500) {
    return "error";
  } else if (statusCode >= 300 && statusCode < 400) {
    return "debug";
  }
  return "debug";
}

export function getRequestLoggerPrefix(req: Request) {
  return `${req.method} ${req.path}`;
}

/** Logs the request path and response status using the given logger. */
export function logRequestAndResponse(req: Request, res: Response) {
  const logger = req.app.locals.logger;
  const logLevel = logLevelFromStatusCode(res.statusCode);

  const requestMessage = `[${getRequestLoggerPrefix(req)}] Response ${res.statusCode} ${res.statusMessage}`;

  switch (logLevel) {
    case "debug":
      logger.debug(requestMessage);
      break;
    case "error":
      logger.error(requestMessage);
      break;
    case "warn":
      logger.warn(requestMessage);
      break;
  }
}

/**
 * Replaces DEL and the C1 control characters with `\uXXXX` escapes. Pino's
 * JSON serialization already escapes the C0 characters, but not these.
 */
export function escapeControlCharacters(text: string) {
  return text.replace(
    /[\u007f-\u009f]/g,
    char => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

/** Path of the route that records log entries sent by the browser. */
export const CLIENT_LOG_PATH = "/logger";

/** True for the client log path in any casing, with or without a trailing slash. */
function isClientLogPath(path: string) {
  return path.toLowerCase().replace(/\/$/, "") === CLIENT_LOG_PATH;
}

/** Creates the pino-http middleware with the given logger and appropriate options. */
export function requestLoggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const logger = req.app.locals.logger;

    // Ignore requests to the client log endpoint
    if (isClientLogPath(req.path)) {
      next();
      return;
    }

    // Ignore CORS options requests
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    logger.trace(`[${req.method} ${req.path}] Request received`);

    // Wait for the response to finish
    res.on("finish", () => {
      logRequestAndResponse(req, res);
    });

    next();
  };
}
