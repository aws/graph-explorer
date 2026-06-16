// @vitest-environment happy-dom
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
  test("should send logs to the server via relative URL", () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);
    document.head.innerHTML = '<base href="https://example.com/explorer/" />';

    const connector = new ServerLoggerConnector();

    connector.error("error msg");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "https://example.com/logger" }),
      {
        method: "POST",
        headers: { level: "error", message: JSON.stringify("error msg") },
      },
    );

    connector.warn("warn msg");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "https://example.com/logger" }),
      {
        method: "POST",
        headers: { level: "warn", message: JSON.stringify("warn msg") },
      },
    );

    connector.info("info msg");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "https://example.com/logger" }),
      {
        method: "POST",
        headers: { level: "info", message: JSON.stringify("info msg") },
      },
    );

    connector.debug("debug msg");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "https://example.com/logger" }),
      {
        method: "POST",
        headers: { level: "debug", message: JSON.stringify("debug msg") },
      },
    );

    connector.trace("trace msg");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "https://example.com/logger" }),
      {
        method: "POST",
        headers: { level: "trace", message: JSON.stringify("trace msg") },
      },
    );
  });

  test("should resolve logger path relative to baseURI", () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);
    document.head.innerHTML =
      '<base href="https://example.com/proxy/9250/explorer/" />';

    const connector = new ServerLoggerConnector();
    connector.info("test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/proxy/9250/logger",
      }),
      expect.any(Object),
    );
  });
});
