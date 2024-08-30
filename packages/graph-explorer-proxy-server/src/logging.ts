import { NextFunction, Request, Response } from "express";
import { pino } from "pino";
import { PrettyOptions } from "pino-pretty";
import { env } from "./env.js";

export type LogLevel = pino.LevelWithSilent;

export const logger = createLogger();

/** Create a logger instance with pino. */
function createLogger() {
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
  const level = env.LOG_LEVEL;

  return pino({
    level,
    transport: {
      target: "pino-pretty",
      options,
    },
  });
}

/** Chooses an log level appropriate for the given status code. */
function logLevelFromStatusCode(statusCode: number): LogLevel {
  if (statusCode >= 400 && statusCode < 500) {
    return "warn";
  } else if (statusCode >= 500) {
    return "error";
  } else if (statusCode >= 300 && statusCode < 400) {
    return "silent";
  }
  return "debug";
}

/** Logs the request path and response status using the given logger. */
export function logRequestAndResponse(req: Request, res: Response) {
  const logLevel = logLevelFromStatusCode(res.statusCode);

  const requestMessage = `${res.statusCode} - ${req.method} ${req.path}`;

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

/** Creates the pino-http middleware with the given logger and appropriate options. */
export function requestLoggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ignore requests to logger endpoint
    if (req.path.includes("/logger")) {
      next();
      return;
    }

    // Ignore CORS options requests
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    // Wait for the request to complete.
    req.on("end", () => {
      logRequestAndResponse(req, res);
    });

    next();
  };
}
