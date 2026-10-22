import type { LogLevel } from "@shared/types";

import { logger } from "@/utils";

import { apiUrl } from "./utils/apiUrl";

export interface LoggerConnector {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  trace(message: string): void;
}

/** Sends log messages to the server via relative URL. */
export class ServerLoggerConnector implements LoggerConnector {
  #clientLogger: ClientLoggerConnector;

  constructor() {
    this.#clientLogger = new ClientLoggerConnector();
  }

  public error(message: string) {
    this.#clientLogger.error(message);
    return this.#sendLog("error", message);
  }

  public warn(message: string) {
    this.#clientLogger.warn(message);
    return this.#sendLog("warn", message);
  }

  public info(message: string) {
    this.#clientLogger.info(message);
    return this.#sendLog("info", message);
  }

  public debug(message: string) {
    this.#clientLogger.info(message);
    return this.#sendLog("debug", message);
  }

  public trace(message: string) {
    this.#clientLogger.trace(message);
    return this.#sendLog("trace", message);
  }

  async #sendLog(level: LogLevel, message: string) {
    try {
      await fetch(apiUrl("logger"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, message }),
      });
    } catch (err) {
      logger.error("Failed to send log to server", err);
    }
  }
}

/** Sends logs to the browser's console. */
export class ClientLoggerConnector implements LoggerConnector {
  error(message: string): void {
    logger.error(message);
  }
  warn(message: string): void {
    logger.warn(message);
  }
  info(message: string): void {
    logger.log(message);
  }
  debug(message: string): void {
    logger.debug(message);
  }
  trace(message: string): void {
    logger.log(message);
  }
}
