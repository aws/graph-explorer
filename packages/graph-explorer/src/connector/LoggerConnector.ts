export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export default class LoggerConnector {
  private readonly _baseUrl: string;

  constructor(connectionUrl: string) {
    const url = connectionUrl.replace(/\/$/, "");
    this._baseUrl = `${url}/logger`;
  }

  public error(message: unknown) {
    return this._sendLog("error", message);
  }

  public warn(message: unknown) {
    return this._sendLog("warn", message);
  }

  public info(message: unknown) {
    return this._sendLog("info", message);
  }

  public debug(message: unknown) {
    return this._sendLog("debug", message);
  }

  public trace(message: unknown) {
    return this._sendLog("trace", message);
  }

  private _sendLog(level: LogLevel, message: unknown) {
    return fetch(this._baseUrl, {
      method: "POST",
      headers: {
        level,
        message: JSON.stringify(message),
      },
    });
  }
}
