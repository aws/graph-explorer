import type { Response } from "express";

import { errorHandlingMiddleware, extractErrorInfo } from "./error-handler.ts";
import { HttpError } from "./errors.ts";
import { createMockRequest } from "./testing.ts";

function createMockResponse() {
  return {
    status: vi.fn(),
    send: vi.fn(),
  } as unknown as Response;
}

describe("extractErrorInfo", () => {
  it("carries status, message, and details from an HttpError", () => {
    const error = new HttpError(403, "Forbidden", { field: "name" });

    expect(extractErrorInfo(error)).toStrictEqual({
      status: 403,
      message: "Forbidden",
      field: "name",
    });
  });

  it("surfaces a top-level errno code", () => {
    const error = Object.assign(
      new Error(
        "request to http://db:8182/gremlin failed, reason: connect ECONNREFUSED 10.0.0.4:8182",
      ),
      { code: "ECONNREFUSED" },
    );

    expect(extractErrorInfo(error)).toStrictEqual({
      status: 500,
      message:
        "request to http://db:8182/gremlin failed, reason: connect ECONNREFUSED 10.0.0.4:8182",
      code: "ECONNREFUSED",
    });
  });

  // The payload goes straight to the browser, so a wrapped system error must
  // not drag the rest of its cause along with the errno.
  it("surfaces cause.code without forwarding the rest of the cause", () => {
    const error = new Error("fetch failed", {
      cause: {
        code: "ENOTFOUND",
        stack: "Error: fetch failed\n    at /graph-explorer/src/app.ts:210",
        hostname: "internal-db.example.com",
        path: "/etc/ssl/private/server.key",
        syscall: "getaddrinfo",
      },
    });

    expect(extractErrorInfo(error)).toStrictEqual({
      status: 500,
      message: "fetch failed",
      code: "ENOTFOUND",
    });
  });

  it("omits the code when the error has none", () => {
    expect(extractErrorInfo(new Error("Something broke"))).toStrictEqual({
      status: 500,
      message: "Something broke",
    });
  });

  it("ignores a non-string code", () => {
    const error = Object.assign(new Error("bad code"), { code: 500 });

    expect(extractErrorInfo(error)).toStrictEqual({
      status: 500,
      message: "bad code",
    });
  });

  it("falls back to a generic message for a thrown non-Error", () => {
    expect(extractErrorInfo("boom")).toStrictEqual({
      status: 500,
      message: "Internal Server Error",
      name: "Error",
    });
  });
});

describe("errorHandlingMiddleware", () => {
  it("sends the errno code to the client so display errors can use it", () => {
    const middleware = errorHandlingMiddleware();
    const response = createMockResponse();
    const error = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });

    middleware(error, createMockRequest(), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: {
        status: 500,
        message: "connect ECONNREFUSED",
        code: "ECONNREFUSED",
      },
    });
  });

  describe("request header logging", () => {
    // node-fetch's real wording when handed a URL carrying userinfo, verified
    // against node-fetch 3. The value appears in the header log line the
    // middleware writes for every failed request.
    const credentialedUrl = "https://someone:hunter2@my-db.example.com:8182";
    const fetchError = new TypeError(
      `${credentialedUrl}/gremlin is an url with embedded credentials.`,
    );

    function logHeaderLine(headers: Record<string, string>) {
      const request = createMockRequest({ headers });
      const errorSpy = vi.spyOn(request.app.locals.logger, "error");

      errorHandlingMiddleware()(
        fetchError,
        request,
        createMockResponse(),
        vi.fn(),
      );

      const headerCall = errorSpy.mock.calls.find(
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
