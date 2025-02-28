export class NetworkError extends Error {
  statusCode: number;
  data: any;
  constructor(message: string, statusCode: number, data: any) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
