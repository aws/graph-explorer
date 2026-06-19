import { toast } from "sonner";

import { logger } from "@/utils";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export interface LoggerConnector {
  error(message: unknown): Promise<void>;
  warn(message: unknown): Promise<void>;
  info(message: unknown): Promise<void>;
  debug(message: unknown): Promise<void>;
  trace(message: unknown): Promise<void>;
}

/** Sends log messages to the server in the connection configuration. */
export class ServerLoggerConnector implements LoggerConnector {
  private readonly _baseUrl: string;
  private readonly _clientLogger: ClientLoggerConnector;

  constructor(connectionUrl: string) {
    const url = connectionUrl.replace(/\/$/, "");
    this._baseUrl = `${url}/logger`;
    this._clientLogger = new ClientLoggerConnector();
  }

  public error(message: unknown) {
    void this._clientLogger.error(message);
    return this._sendLog("error", message);
  }

  public warn(message: unknown) {
    void this._clientLogger.warn(message);
    return this._sendLog("warn", message);
  }

  public info(message: unknown) {
    void this._clientLogger.info(message);
    return this._sendLog("info", message);
  }

  public debug(message: unknown) {
    void this._clientLogger.info(message);
    return this._sendLog("debug", message);
  }

  public trace(message: unknown) {
    void this._clientLogger.trace(message);
    return this._sendLog("trace", message);
  }

  private async _sendLog(level: LogLevel, message: unknown) {
    try {
      await fetch(this._baseUrl, {
        method: "POST",
        headers: {
          level,
          message: JSON.stringify(message),
        },
      });
    } catch (error) {
      logger.warn("Failed to send log to server", error);
      toast.warning("Failed to send log to the server.");
    }
  }
}

/** Sends logs to the browser's console. */
export class ClientLoggerConnector implements LoggerConnector {
  error(message: unknown): Promise<void> {
    logger.error(message);
    return Promise.resolve();
  }
  warn(message: unknown): Promise<void> {
    logger.warn(message);
    return Promise.resolve();
  }
  info(message: unknown): Promise<void> {
    logger.log(message);
    return Promise.resolve();
  }
  debug(message: unknown): Promise<void> {
    logger.debug(message);
    return Promise.resolve();
  }
  trace(message: unknown): Promise<void> {
    logger.log(message);
    return Promise.resolve();
  }
}
