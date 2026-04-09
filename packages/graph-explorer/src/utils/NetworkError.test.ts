import { NetworkError } from "./NetworkError";

describe("NetworkError", () => {
  it.each([
    [400, "Bad Request"],
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [404, "Not Found"],
    [405, "Method Not Allowed"],
    [408, "Request Timeout"],
    [409, "Conflict"],
    [429, "Too Many Requests"],
    [500, "Internal Server Error"],
    [502, "Bad Gateway"],
    [503, "Service Unavailable"],
    [504, "Gateway Timeout"],
  ])("sets statusText for known status code %i", (code, expectedText) => {
    const error = new NetworkError("test", code, null);
    expect(error.statusText).toBe(expectedText);
  });

  it.each([418, 599])(
    "sets statusText to undefined for unknown code %i",
    code => {
      const error = new NetworkError("test", code, null);
      expect(error.statusText).toBeUndefined();
    },
  );

  it("preserves message, statusCode, and data", () => {
    const data = { detail: "not found" };
    const error = new NetworkError("Something failed", 404, data);
    expect(error.message).toBe("Something failed");
    expect(error.statusCode).toBe(404);
    expect(error.data).toBe(data);
  });

  it('has name "NetworkError"', () => {
    const error = new NetworkError("test", 500, null);
    expect(error.name).toBe("NetworkError");
  });

  it("is instanceof NetworkError", () => {
    const error = new NetworkError("test", 500, null);
    expect(error).toBeInstanceOf(NetworkError);
  });

  it("is instanceof Error", () => {
    const error = new NetworkError("test", 500, null);
    expect(error).toBeInstanceOf(Error);
  });
});
