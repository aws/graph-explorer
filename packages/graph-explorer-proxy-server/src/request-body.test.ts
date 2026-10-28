import type { Request, RequestHandler, Response } from "express";

import { describe, expect, it, vi } from "vite-plus/test";

import { RejectedRequestBodyError } from "./errors.ts";
import { rejectUnreadableBody } from "./request-body.ts";

/** Runs the wrapped parser and returns whatever it passed to `next`. */
function run(parser: RequestHandler) {
  const next = vi.fn();
  rejectUnreadableBody(parser)({} as Request, {} as Response, next);
  return next;
}

function parserFailingWith(error: unknown): RequestHandler {
  return (_request, _response, next) => next(error);
}

describe("rejectUnreadableBody", () => {
  it("passes a successfully parsed body through", () => {
    const next = run((_request, _response, next) => next());

    expect(next).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it("keeps the status and type of a parser error", () => {
    const next = run(
      parserFailingWith(
        Object.assign(new Error("request entity too large"), {
          type: "entity.too.large",
          status: 413,
        }),
      ),
    );

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(RejectedRequestBodyError);
    expect(error).toMatchObject({
      status: 413,
      message: "request entity too large",
      details: { type: "entity.too.large" },
    });
  });

  it("replaces the message of an error that carries the body", () => {
    const next = run(
      parserFailingWith(
        Object.assign(new Error(`Unexpected token 'Xq7marker'`), {
          type: "entity.parse.failed",
          status: 400,
          body: "Xq7marker",
        }),
      ),
    );

    const error = next.mock.calls[0][0];
    expect(error).toMatchObject({
      status: 400,
      message: "Request body could not be parsed",
      details: { type: "entity.parse.failed" },
    });
    expect(error).not.toHaveProperty("body");
  });

  it("answers 400 to an error that has no status", () => {
    const next = run(parserFailingWith(new Error("request aborted")));

    expect(next.mock.calls[0][0]).toMatchObject({
      status: 400,
      message: "request aborted",
    });
  });

  it("answers 400 with the fixed message to a value that is not an error", () => {
    const next = run(parserFailingWith("Xq7marker"));

    expect(next.mock.calls[0][0]).toMatchObject({
      status: 400,
      message: "Request body could not be parsed",
    });
  });
});
