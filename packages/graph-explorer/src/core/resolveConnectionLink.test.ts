// @vitest-environment happy-dom
import { DbState } from "@/utils/testing";

import { resolveConnectionLink } from "./resolveConnectionLink";
import { getAppStore } from "./StateProvider/appStore";

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

describe("resolveConnectionLink", () => {
  // The `#/connect` route exists only for connection links, so no params at
  // all is a missing graphDbUrl, which is invalid rather than a no-op.
  test("is invalid when there is no link", () => {
    new DbState().applyTo(getAppStore());

    expect(resolveConnectionLink("")).toEqual({
      kind: "invalid",
      error: expect.objectContaining({
        problems: [{ param: "graphDbUrl", requirement: "is required" }],
      }),
    });
  });

  test("is a no-op when the link targets the active connection", () => {
    const state = new DbState();
    const activeUrl = "https://active.neptune.amazonaws.com";
    state.activeConfig.connection = {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: activeUrl,
    };
    state.applyTo(getAppStore());

    expect(resolveConnectionLink(searchFor(activeUrl))).toEqual({
      kind: "none",
    });
  });

  test("proposes a connection when nothing matches", () => {
    new DbState().applyTo(getAppStore());

    const intent = resolveConnectionLink(
      `${searchFor("https://brand-new.neptune.amazonaws.com")}&name=Brand+New`,
    );

    expect(intent).toMatchObject({
      kind: "create",
      name: "Brand New",
      connection: {
        graphDbUrl: "https://brand-new.neptune.amazonaws.com",
        queryEngine: "gremlin",
        proxyConnection: true,
      },
    });
  });

  test("reports what was wrong with an invalid link", () => {
    new DbState().applyTo(getAppStore());

    expect(resolveConnectionLink("?graphDbUrl=not-a-url")).toEqual({
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

  // Resolution reads the store when it runs, so a connection added after the
  // app started is still matched.
  test("resolves against the connections present when it is called", () => {
    const state = new DbState();
    const laterUrl = "https://later.neptune.amazonaws.com";
    state.applyTo(getAppStore());

    expect(resolveConnectionLink(searchFor(laterUrl)).kind).toBe("create");

    state.activeConfig.connection = {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: laterUrl,
    };
    state.applyTo(getAppStore());

    expect(resolveConnectionLink(searchFor(laterUrl))).toEqual({
      kind: "none",
    });
  });
});
