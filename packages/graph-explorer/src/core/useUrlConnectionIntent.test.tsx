import type { PropsWithChildren } from "react";

// @vitest-environment happy-dom
import { renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router";

import { getAppStore } from "@/core";
import { DbState } from "@/utils/testing";

import { useUrlConnectionIntent } from "./useUrlConnectionIntent";

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

function renderIntent(search: string, state = new DbState()) {
  const store = getAppStore();
  state.applyTo(store);
  return renderHook(() => useUrlConnectionIntent(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/connect${search}`]}>
          {children}
        </MemoryRouter>
      </Provider>
    ),
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
    expect(result.current).toEqual({ kind: "invalid" });
  });
});
