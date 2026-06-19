import { describe, expect, test } from "vitest";

import { classifyStorageError } from "./classifyStorageError";

function domException(name: string) {
  return new DOMException("boom", name);
}

describe("classifyStorageError", () => {
  test("classifies a quota-exceeded error as terminal-quota", () => {
    expect(classifyStorageError(domException("QuotaExceededError"))).toBe(
      "terminal-quota",
    );
  });

  test.each(["SecurityError", "InvalidStateError"])(
    "classifies %s as terminal-access",
    name => {
      expect(classifyStorageError(domException(name))).toBe("terminal-access");
    },
  );

  test.each(["AbortError", "UnknownError", "TimeoutError"])(
    "classifies the transient error %s as retryable",
    name => {
      expect(classifyStorageError(domException(name))).toBe("retryable");
    },
  );

  test("defaults an unrecognized error to retryable", () => {
    expect(classifyStorageError(new Error("something odd"))).toBe("retryable");
  });

  test("defaults a non-error value to retryable", () => {
    expect(classifyStorageError("not an error")).toBe("retryable");
    expect(classifyStorageError(undefined)).toBe("retryable");
  });
});
