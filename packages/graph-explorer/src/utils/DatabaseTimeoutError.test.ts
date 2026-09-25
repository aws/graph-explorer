import {
  databaseTimeoutCode,
  DatabaseTimeoutError,
} from "./DatabaseTimeoutError";
import { NetworkError } from "./NetworkError";

describe("DatabaseTimeoutError", () => {
  it("has the literal name DatabaseTimeoutError", () => {
    const error = new DatabaseTimeoutError(
      "Query timed out",
      500,
      { code: "TimeLimitExceededException" },
      "TimeLimitExceededException",
    );
    expect(error.name).toBe("DatabaseTimeoutError");
  });

  it("is an instance of NetworkError and DatabaseTimeoutError", () => {
    const error = new DatabaseTimeoutError(
      "Query timed out",
      500,
      { code: "TimeLimitExceededException" },
      "TimeLimitExceededException",
    );
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toBeInstanceOf(DatabaseTimeoutError);
  });

  it("exposes message, statusCode, data, and databaseCode", () => {
    const data = { code: "TimeLimitExceededException", requestId: "abc-123" };
    const error = new DatabaseTimeoutError(
      "Query timed out",
      500,
      data,
      "TimeLimitExceededException",
    );
    expect(error.message).toBe("Query timed out");
    expect(error.statusCode).toBe(500);
    expect(error.data).toStrictEqual(data);
    expect(error.databaseCode).toBe("TimeLimitExceededException");
  });
});

describe("databaseTimeoutCode", () => {
  it("returns the code for a Neptune query timeout", () => {
    const data = {
      requestId: "abc-123",
      code: "TimeLimitExceededException",
      detailedMessage: "A timeout occurred",
    };
    expect(databaseTimeoutCode(data)).toBe("TimeLimitExceededException");
  });

  it("returns the code for a Gremlin Server evaluation timeout", () => {
    // Captured from a local `tinkerpop/gremlin-server:3.8` container after a
    // query exceeded the server's `evaluationTimeout`.
    const data = {
      message:
        "Evaluation exceeded the configured 'evaluationTimeout' threshold of 30000 ms or evaluation was otherwise cancelled directly for request [...]",
      "Exception-Class": "java.util.concurrent.TimeoutException",
      exceptions: ["java.util.concurrent.TimeoutException"],
      requestId: "65a196b9-48a3-48c0-911a-b73ae7903f04",
    };
    expect(databaseTimeoutCode(data)).toBe(
      "java.util.concurrent.TimeoutException",
    );
  });

  it("returns undefined for a memory limit error", () => {
    expect(
      databaseTimeoutCode({ code: "MemoryLimitExceededException" }),
    ).toBeUndefined();
  });

  it("returns undefined for ETIMEDOUT", () => {
    expect(databaseTimeoutCode({ code: "ETIMEDOUT" })).toBeUndefined();
  });

  it("returns undefined for a user-cancelled query", () => {
    expect(
      databaseTimeoutCode({ code: "CancelledByUserException" }),
    ).toBeUndefined();
  });

  it("returns undefined for throttling", () => {
    expect(
      databaseTimeoutCode({ code: "ThrottlingException" }),
    ).toBeUndefined();
  });

  it("returns undefined for non-object data", () => {
    expect(databaseTimeoutCode("some text")).toBeUndefined();
    expect(databaseTimeoutCode(undefined)).toBeUndefined();
    expect(databaseTimeoutCode(null)).toBeUndefined();
  });
});
