// @vitest-environment happy-dom
import { DbState, renderHookWithState } from "@/utils/testing";

import { useUrlConnectionIntent } from "./useUrlConnectionIntent";

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

function renderIntent(search: string, state = new DbState()) {
  return renderHookWithState(() => useUrlConnectionIntent(), state, {
    initialEntries: [`/connect${search}`],
  });
}

describe("useUrlConnectionIntent", () => {
  test("is a no-op when there are no URL params", () => {
    const { result } = renderIntent("");
    expect(result.current).toEqual({ kind: "none" });
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

    const { result } = renderIntent(searchFor(activeUrl), state);
    expect(result.current).toEqual({ kind: "none" });
  });

  test("creates a new connection when nothing matches", () => {
    const { result } = renderIntent(
      searchFor("https://brand-new.neptune.amazonaws.com"),
    );
    expect(result.current.kind).toBe("create");
  });

  test("is invalid when a connection link carries a malformed graphDbUrl", () => {
    const { result } = renderIntent("?graphDbUrl=not-a-url");
    expect(result.current.kind).toBe("invalid");
  });

  test("is invalid when the link names an unsupported query engine", () => {
    const { result } = renderIntent(
      searchFor("https://brand-new.neptune.amazonaws.com", "sql"),
    );
    expect(result.current.kind).toBe("invalid");
  });

  test("carries what was wrong with an invalid link", () => {
    const { result } = renderIntent("?graphDbUrl=not-a-url");
    expect(result.current).toEqual({
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
});
