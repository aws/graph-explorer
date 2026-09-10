// @vitest-environment happy-dom
import { getAppStore } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useResolveUrlConnectionIntent } from "./useResolveUrlConnectionIntent";

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

function resolveIntent(search: string, state = new DbState()) {
  const { result } = renderHookWithState(
    () => useResolveUrlConnectionIntent(),
    state,
  );
  return result.current(search);
}

describe("useResolveUrlConnectionIntent", () => {
  test("is a no-op when there are no URL params", () => {
    expect(resolveIntent("")).toEqual({ kind: "none" });
  });

  test("is a no-op when the URL matches the active connection", () => {
    const state = new DbState();
    const activeUrl = "https://active.neptune.amazonaws.com";
    state.activeConfig.connection = {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: activeUrl,
    };

    expect(resolveIntent(searchFor(activeUrl), state)).toEqual({
      kind: "none",
    });
  });

  test("creates a new connection when nothing matches", () => {
    expect(
      resolveIntent(searchFor("https://brand-new.neptune.amazonaws.com")).kind,
    ).toBe("create");
  });

  test("is invalid when a connection link carries a malformed graphDbUrl", () => {
    expect(resolveIntent("?graphDbUrl=not-a-url").kind).toBe("invalid");
  });

  test("is invalid when the link names an unsupported query engine", () => {
    expect(
      resolveIntent(searchFor("https://brand-new.neptune.amazonaws.com", "sql"))
        .kind,
    ).toBe("invalid");
  });

  test("carries what was wrong with an invalid link", () => {
    expect(resolveIntent("?graphDbUrl=not-a-url")).toEqual({
      kind: "invalid",
      error: expect.objectContaining({
        problems: [
          {
            param: "graphDbUrl",
            requirement: "must be a valid http or https URL",
          },
        ],
      }),
    });
  });

  // The intent is resolved when the callback runs, not when the hook renders, so
  // a connection added after mount is still matched.
  test("resolves against the connections present when it is called", () => {
    const state = new DbState();
    const laterUrl = "https://later.neptune.amazonaws.com";
    const { result } = renderHookWithState(
      () => useResolveUrlConnectionIntent(),
      state,
    );

    expect(result.current(searchFor(laterUrl)).kind).toBe("create");

    state.activeConfig.connection = {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: laterUrl,
    };
    state.applyTo(getAppStore());

    expect(result.current(searchFor(laterUrl))).toEqual({ kind: "none" });
  });
});
