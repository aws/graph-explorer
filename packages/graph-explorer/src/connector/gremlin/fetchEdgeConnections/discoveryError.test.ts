import { DatabaseTimeoutError, FetchTimeoutError, NetworkError } from "@/utils";

import {
  EdgeConnectionDiscoveryError,
  type FailedDiscovery,
  isTooBig,
} from "./discoveryError";

function attempt(overrides: Partial<FailedDiscovery> = {}): FailedDiscovery {
  return {
    strategy: "sampled",
    requests: 1,
    totalEdges: 10,
    degraded: false,
    cause: "database-limit",
    ...overrides,
  };
}

describe("isTooBig", () => {
  it("is true for a FetchTimeoutError", () => {
    expect(isTooBig(new FetchTimeoutError(1000, new Error("aborted")))).toBe(
      true,
    );
  });

  it("is true for a DatabaseTimeoutError", () => {
    expect(
      isTooBig(
        new DatabaseTimeoutError(
          "Query cannot be completed",
          500,
          {},
          "TimeLimitExceededException",
        ),
      ),
    ).toBe(true);
  });

  it("is true for a NetworkError carrying the memory limit code", () => {
    expect(
      isTooBig(
        new NetworkError("Query cannot be completed", 500, {
          code: "MemoryLimitExceededException",
        }),
      ),
    ).toBe(true);
  });

  it("is true when the memory limit code is nested in a cause", () => {
    expect(
      isTooBig(
        new NetworkError("Query cannot be completed", 500, {
          cause: { code: "MemoryLimitExceededException" },
        }),
      ),
    ).toBe(true);
  });

  it("is false for an unrelated NetworkError", () => {
    expect(
      isTooBig(
        new NetworkError("Query cannot be completed", 500, {
          code: "MalformedQueryException",
        }),
      ),
    ).toBe(false);
  });

  it("is false for a user cancellation, so it never looks like a size problem", () => {
    expect(isTooBig(new DOMException("Aborted", "AbortError"))).toBe(false);
  });

  it("is false for a plain error", () => {
    expect(isTooBig(new Error("Network error"))).toBe(false);
  });
});

describe("EdgeConnectionDiscoveryError recovery text", () => {
  it("points only at the Fetch Timeout, not the parameter group, when a cheaper pass exhausted our own fetch timeout", () => {
    const error = new EdgeConnectionDiscoveryError(
      attempt({ cause: "fetch-timeout" }),
      new Error("cause"),
    );
    expect(error.recovery).toContain("Fetch Timeout");
    expect(error.recovery).toContain("advanced options");
    expect(error.recovery).not.toContain("parameter group");
    expect(error.recovery).toContain(
      "the Schema view shows node types without the edge connections between them",
    );
  });

  it("points at the database's own query timeout and the parameter group when a cheaper pass exhausted it", () => {
    const error = new EdgeConnectionDiscoveryError(
      attempt({ cause: "database-limit" }),
      new Error("cause"),
    );
    expect(error.recovery).toContain("DB cluster parameter group");
    expect(error.recovery).toContain(
      "the Schema view shows node types without the edge connections between them",
    );
  });

  it("includes the cause in the structured details, keyed apart from the JS cause", () => {
    const jsCause = new Error("Query cannot be completed");
    const error = new EdgeConnectionDiscoveryError(
      attempt({ cause: "fetch-timeout" }),
      jsCause,
    );
    expect(error.details).toMatchObject({ failureCause: "fetch-timeout" });
    expect(error.cause).toBe(jsCause);
  });
});
