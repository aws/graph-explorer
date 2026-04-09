import { ServerConnectionError } from "./ServerConnectionError";

describe("ServerConnectionError", () => {
  it('has name "ServerConnectionError"', () => {
    const error = new ServerConnectionError(
      "http://localhost:8182/query",
      new TypeError("Failed to fetch"),
    );
    expect(error.name).toBe("ServerConnectionError");
  });

  it("has a fixed message", () => {
    const error = new ServerConnectionError(
      "http://localhost:8182/query",
      new TypeError("Failed to fetch"),
    );
    expect(error.message).toBe("Unable to reach the server");
  });

  it("stores the URL", () => {
    const error = new ServerConnectionError(
      "https://example.com:8182/sparql",
      new TypeError("Failed to fetch"),
    );
    expect(error.url).toBe("https://example.com:8182/sparql");
  });

  it("preserves the original error as cause", () => {
    const cause = new TypeError("Failed to fetch");
    const error = new ServerConnectionError(
      "http://localhost:8182/query",
      cause,
    );
    expect(error.cause).toBe(cause);
  });

  it("is instanceof ServerConnectionError", () => {
    const error = new ServerConnectionError(
      "http://localhost:8182/query",
      new TypeError("Failed to fetch"),
    );
    expect(error).toBeInstanceOf(ServerConnectionError);
  });

  it("is instanceof Error", () => {
    const error = new ServerConnectionError(
      "http://localhost:8182/query",
      new TypeError("Failed to fetch"),
    );
    expect(error).toBeInstanceOf(Error);
  });
});
