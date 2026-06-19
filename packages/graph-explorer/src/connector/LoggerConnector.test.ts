import {
  ClientLoggerConnector,
  ServerLoggerConnector,
} from "./LoggerConnector";

describe("ClientLoggerConnector", () => {
  test("should call logger methods without throwing", () => {
    const connector = new ClientLoggerConnector();
    expect(() => connector.error("test error")).not.toThrow();
    expect(() => connector.warn("test warn")).not.toThrow();
    expect(() => connector.info("test info")).not.toThrow();
    expect(() => connector.debug("test debug")).not.toThrow();
    expect(() => connector.trace("test trace")).not.toThrow();
  });
});

describe("ServerLoggerConnector", () => {
  test("should send logs to the server", async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);

    const connector = new ServerLoggerConnector("https://example.com/");

    await connector.error("error msg");
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logger", {
      method: "POST",
      headers: { level: "error", message: JSON.stringify("error msg") },
    });

    await connector.warn("warn msg");
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logger", {
      method: "POST",
      headers: { level: "warn", message: JSON.stringify("warn msg") },
    });

    await connector.info("info msg");
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logger", {
      method: "POST",
      headers: { level: "info", message: JSON.stringify("info msg") },
    });

    await connector.debug("debug msg");
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logger", {
      method: "POST",
      headers: { level: "debug", message: JSON.stringify("debug msg") },
    });

    await connector.trace("trace msg");
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logger", {
      method: "POST",
      headers: { level: "trace", message: JSON.stringify("trace msg") },
    });
  });

  test("should strip trailing slash from connection URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);

    const connector = new ServerLoggerConnector("https://example.com/");
    await connector.info("test");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/logger",
      expect.any(Object),
    );
  });
});
