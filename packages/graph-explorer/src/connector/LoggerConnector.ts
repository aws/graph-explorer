export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

type Options = {enable?: boolean};
export default class LoggerConnector {
  private readonly _baseUrl: string;
  private readonly _options: Options;

  constructor(connectionUrl: string, options: Options = { enable: true}) {
    const url = connectionUrl.replace(/\/$/, "");
    this._baseUrl = `${url}/logger`;
    this._options = options;
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
    if (!this._options.enable) {
      return;
    }

    return fetch(this._baseUrl, {
      method: "GET",
      headers: {
        level,
        message: JSON.stringify(message)
      }
    });
  }
}