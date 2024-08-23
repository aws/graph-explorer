import { NextFunction, Request, Response } from "express";
import { Logger, pino } from "pino";
import { PrettyOptions } from "pino-pretty";

/** Create a logger instance with pino. */
export function createLogger() {
  // Check whether we are configured with CloudWatch style
  const loggingInCloudWatch = process.env.LOG_STYLE === "cloudwatch";
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
  const level = process.env.LOG_LEVEL || "info";

  return pino({
    level,
    transport: {
      target: "pino-pretty",
      options,
    },
  });
}

/** Creates the pino-http middleware with the given logger and appropriate options. */
export function requestLoggingMiddleware(logger: Logger<never>) {
  return (req: Request, res: Response, next: NextFunction) => {
    let logLevel = "debug";
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = "warn";
    } else if (res.statusCode >= 500) {
      logLevel = "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      logLevel = "silent";
    }

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
    next();
  };
}
