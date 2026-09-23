import type { Request, Response } from "express";

import { errorHandlingMiddleware } from "./error-handler.ts";
import { type AppLogger, createLogger } from "./logging.ts";
import { createTestEnvironment } from "./testing.ts";

const sharedLogger = createLogger(createTestEnvironment());

function createMockRequest(
  headers: Record<string, string> = {},
  logger: AppLogger = sharedLogger,
) {
  return {
    method: "POST",
    path: "/gremlin",
    headers,
    app: {
      locals: {
        logger,
      },
    },
  } as unknown as Request;
}

function createSpyLogger() {
  return { error: vi.fn() } as unknown as AppLogger;
}

function createMockResponse() {
  return {
    status: vi.fn(),
    send: vi.fn(),
  } as unknown as Response;
}

describe("errorHandlingMiddleware", () => {
  describe("request header logging", () => {
    // node-fetch's real wording when handed a URL carrying userinfo, verified
    // against node-fetch 3. The value appears in the header log line the
    // middleware writes for every failed request.
    const credentialedUrl = "https://someone:hunter2@my-db.example.com:8182";
    const fetchError = new TypeError(
      `${credentialedUrl}/gremlin is an url with embedded credentials.`,
    );

    function logHeaderLine(headers: Record<string, string>) {
      const logger = createSpyLogger();

      errorHandlingMiddleware()(
        fetchError,
        createMockRequest(headers, logger),
        createMockResponse(),
        vi.fn(),
      );

      const headerCall = vi
        .mocked(logger.error)
        .mock.calls.find(
          ([first]) =>
            typeof first === "string" && first.includes("Request headers"),
        );
      expect(headerCall).toBeDefined();
      return String(headerCall![1]);
    }

    it("replaces the userinfo of a URL header", () => {
      const line = logHeaderLine({
        "graph-db-connection-url": credentialedUrl,
      });

      expect(line).not.toContain("hunter2");
      expect(line).not.toContain("someone");
      expect(line).toContain("REDACTED:REDACTED@my-db.example.com:8182");
    });

    it("leaves a URL header without userinfo untouched", () => {
      const line = logHeaderLine({
        "graph-db-connection-url": "https://my-db.example.com:8182",
      });

      expect(line).toContain(
        "graph-db-connection-url: https://my-db.example.com:8182",
      );
    });

    it("leaves a non-URL header untouched", () => {
      const line = logHeaderLine({ "user-agent": "supertest/7.2.2" });

      expect(line).toContain("user-agent: supertest/7.2.2");
    });

    it("omits headers outside the allowed list", () => {
      const line = logHeaderLine({
        "graph-db-connection-url": "https://my-db.example.com:8182",
        authorization: "AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE/20260101",
      });

      expect(line).not.toContain("AKIAEXAMPLE");
    });
  });
});
