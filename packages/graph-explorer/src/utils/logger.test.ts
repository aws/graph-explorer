/* oxlint-disable no-console */
import { beforeEach, describe, expect, test, vi } from "vitest";

// Unmock logger so we test the real implementation
vi.unmock("@/utils/logger");

describe("logger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("in production mode", () => {
    beforeEach(() => {
      vi.doMock("./env", () => ({
        env: { DEV: false, PROD: true },
      }));
    });

    test("should suppress debug and log calls", async () => {
      const { default: logger } = await import("./logger");

      logger.debug("test debug");
      logger.log("test log");

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test("should allow warn and error calls", async () => {
      const { default: logger } = await import("./logger");

      logger.warn("test warn");
      logger.error("test error");

      expect(console.warn).toHaveBeenCalledWith("test warn");
      expect(console.error).toHaveBeenCalledWith("test error");
    });

    test("should enable debug and log when diagnostic logging is on", async () => {
      const { default: logger, setDiagnosticLogging } =
        await import("./logger");

      setDiagnosticLogging(true);

      logger.debug("test debug");
      logger.log("test log");

      expect(console.debug).toHaveBeenCalledWith("test debug");
      expect(console.log).toHaveBeenCalledWith("test log");
    });

    test("should suppress debug and log again when diagnostic logging is turned off", async () => {
      const { default: logger, setDiagnosticLogging } =
        await import("./logger");

      setDiagnosticLogging(true);
      setDiagnosticLogging(false);

      logger.debug("test debug");
      logger.log("test log");

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test("should forward multiple arguments", async () => {
      const { default: logger, setDiagnosticLogging } =
        await import("./logger");

      setDiagnosticLogging(true);

      logger.debug("msg", 1, { key: "value" });
      logger.log("msg", 2, [3]);

      expect(console.debug).toHaveBeenCalledWith("msg", 1, { key: "value" });
      expect(console.log).toHaveBeenCalledWith("msg", 2, [3]);
    });

    test("should not affect warn and error when diagnostic logging is toggled", async () => {
      const { default: logger, setDiagnosticLogging } =
        await import("./logger");

      setDiagnosticLogging(true);
      setDiagnosticLogging(false);

      logger.warn("still warns");
      logger.error("still errors");

      expect(console.warn).toHaveBeenCalledWith("still warns");
      expect(console.error).toHaveBeenCalledWith("still errors");
    });
  });

  describe("in dev mode", () => {
    beforeEach(() => {
      vi.doMock("./env", () => ({
        env: { DEV: true, PROD: false },
      }));
    });

    test("should allow debug and log calls", async () => {
      const { default: logger } = await import("./logger");

      logger.debug("test debug");
      logger.log("test log");

      expect(console.debug).toHaveBeenCalledWith("test debug");
      expect(console.log).toHaveBeenCalledWith("test log");
    });
  });
});
