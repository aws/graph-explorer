import { logger } from "@/utils";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export interface LoggerConnector {
  error(message: unknown): void;
  warn(message: unknown): void;
  info(message: unknown): void;
  debug(message: unknown): void;
  trace(message: unknown): void;
}

/** Sends log messages to the server in the connection configuration. */
export class ServerLoggerConnector implements LoggerConnector {
  #baseUrl: string;
  #clientLogger: ClientLoggerConnector;

  constructor(connectionUrl: string) {
    const url = connectionUrl.replace(/\/$/, "");
    this.#baseUrl = `${url}/logger`;
    this.#clientLogger = new ClientLoggerConnector();
  }

  public error(message: unknown) {
    this.#clientLogger.error(message);
    return this.#sendLog("error", message);
  }

  public warn(message: unknown) {
    this.#clientLogger.warn(message);
    return this.#sendLog("warn", message);
  }

  public info(message: unknown) {
    this.#clientLogger.info(message);
    return this.#sendLog("info", message);
  }

  public debug(message: unknown) {
    this.#clientLogger.info(message);
    return this.#sendLog("debug", message);
  }

  public trace(message: unknown) {
    this.#clientLogger.trace(message);
    return this.#sendLog("trace", message);
  }

  #sendLog(level: LogLevel, message: unknown) {
    return fetch(this.#baseUrl, {
      method: "POST",
      headers: {
        level,
        message: JSON.stringify(message),
      },
    }).catch(err => logger.error("Failed to send log to server", err));
  }
}

/** Sends logs to the browser's console. */
export class ClientLoggerConnector implements LoggerConnector {
  error(message: unknown): void {
    logger.error(message);
  }
  warn(message: unknown): void {
    logger.warn(message);
  }
  info(message: unknown): void {
    logger.log(message);
  }
  debug(message: unknown): void {
    logger.debug(message);
  }
  trace(message: unknown): void {
    logger.log(message);
  }
}
