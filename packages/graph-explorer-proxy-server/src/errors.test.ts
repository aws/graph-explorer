import { z } from "zod";

import { HttpError, RequestValidationError } from "./errors.ts";

describe("HttpError", () => {
  it("carries status and message", () => {
    const error = new HttpError(403, "Forbidden");
    expect(error.status).toBe(403);
    expect(error.message).toBe("Forbidden");
    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of Error", () => {
    const error = new HttpError(500, "Internal");
    expect(error).toBeInstanceOf(Error);
  });

  it("carries optional details", () => {
    const error = new HttpError(422, "Validation failed", {
      field: "name",
      reason: "too short",
    });
    expect(error.details).toEqual({ field: "name", reason: "too short" });
  });

  it("has undefined details when none provided", () => {
    const error = new HttpError(500, "Internal");
    expect(error.details).toBeUndefined();
  });
});

describe("RequestValidationError", () => {
  it("extends HttpError with status 400", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    assert(!result.success);

    const error = new RequestValidationError(result.error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(400);
    expect(error.zodError).toBe(result.error);
  });

  it("formats the Zod error as the message", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    assert(!result.success);

    const error = new RequestValidationError(result.error);
    expect(error.message).toBe(z.prettifyError(result.error));
  });

  it("includes zodError in details for serialization", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    assert(!result.success);

    const error = new RequestValidationError(result.error);
    expect(error.details).toEqual({ zodError: result.error });
  });
});
