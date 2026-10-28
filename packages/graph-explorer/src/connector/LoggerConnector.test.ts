// @vitest-environment happy-dom

import { describe, expect, test, vi } from "vite-plus/test";

import { logger, ReverseProxyMisconfiguredError } from "@/utils";
import { stubDocumentUrl } from "@/utils/testing";

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
  test.each([
    { method: "error", consoleMethod: "error" },
    { method: "warn", consoleMethod: "warn" },
    { method: "info", consoleMethod: "log" },
    { method: "debug", consoleMethod: "debug" },
    { method: "trace", consoleMethod: "log" },
  ] as const)(
    "$method writes to console $consoleMethod and sends the $method level",
    ({ method, consoleMethod }) => {
      const mockFetch = vi.fn().mockResolvedValue({});
      vi.stubGlobal("fetch", mockFetch);
      stubDocumentUrl("https://example.com/explorer/");

      new ServerLoggerConnector()[method](`${method} msg`);

      for (const name of ["error", "warn", "log", "debug"] as const) {
        expect(vi.mocked(logger[name]).mock.calls).toStrictEqual(
          name === consoleMethod ? [[`${method} msg`]] : [],
        );
      }
      expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ href: "https://example.com/logger" }),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level: method, message: `${method} msg` }),
        },
      );
    },
  );

  test("should resolve the logger path relative to baseURI", () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);
    stubDocumentUrl("https://example.com/proxy/9250/explorer/");

    const connector = new ServerLoggerConnector();
    connector.info("test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/proxy/9250/logger",
      }),
      expect.any(Object),
    );
  });

  test("sends a message with backslashes and newlines unchanged", () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);
    stubDocumentUrl("https://example.com/explorer/");

    const connector = new ServerLoggerConnector();
    connector.info("C:\\Users\\kris\nnext");

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toStrictEqual({
      level: "info",
      message: "C:\\Users\\kris\nnext",
    });
  });

  test("does not throw when the API URL can't be resolved", async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", mockFetch);
    stubDocumentUrl("https://example.com/renamed/");

    const connector = new ServerLoggerConnector();

    let result: Promise<unknown> | undefined;
    expect(() => {
      result = connector.error("error msg");
    }).not.toThrow();
    await expect(result).resolves.toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      "Failed to send log to server",
      expect.any(ReverseProxyMisconfiguredError),
    );
  });
});
