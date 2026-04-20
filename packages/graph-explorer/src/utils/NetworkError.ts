const HTTP_STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export class NetworkError extends Error {
  statusCode: number;
  statusText: string | undefined;
  data: any;

  constructor(message: string, statusCode: number, data: any) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
    this.statusText = HTTP_STATUS_TEXT[statusCode];
    this.data = data;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
