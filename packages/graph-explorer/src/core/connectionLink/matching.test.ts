// @vitest-environment happy-dom

import type { ConnectionConfig } from "@shared/types";

import { describe, expect, test } from "vitest";

import { createNewConfigurationId, type RawConfiguration } from "@/connections";
import { DbState } from "@/utils/testing";

import { getAppStore } from "../StateProvider/appStore";
import { resolveConnectionLink } from "./connectionLink";

function storedConnection(
  displayLabel: string,
  connection: ConnectionConfig,
): RawConfiguration {
  return { id: createNewConfigurationId(), displayLabel, connection };
}

function linkTo(graphDbUrl: string, otherParams = "") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}${otherParams}`;
}

/** Resolves a link with only the given connections stored. */
function resolve(
  search: string,
  connections: RawConfiguration[],
  active?: RawConfiguration,
) {
  const state = new DbState();
  if (active) {
    state.activeConfig = active;
  } else {
    state.withNoActiveConnection();
  }
  for (const connection of connections) {
    if (connection !== active) {
      state.addInactiveConnection(connection);
    }
  }
  state.applyTo(getAppStore());
  return resolveConnectionLink(search);
}

/** The stored connection a valid link activates, or null when it creates one. */
function activatedBy(
  search: string,
  connections: RawConfiguration[],
  active?: RawConfiguration,
) {
  const intent = resolve(search, connections, active);
  if (intent.kind === "invalid") {
    throw new Error(`Expected a valid link, got "${intent.error.message}"`);
  }
  return intent.kind === "activate" ? intent.connection : null;
}

/** The connection a link proposes when nothing matches it. */
function proposedBy(search: string) {
  const intent = resolve(search, []);
  if (intent.kind !== "create") {
    throw new Error(`Expected a create intent, got "${intent.kind}"`);
  }
  return intent.connection;
}

describe("resolving a connection link", () => {
  const activeUrl = "https://active.neptune.amazonaws.com";
  const active = storedConnection("Active", {
    queryEngine: "gremlin",
    graphDbUrl: activeUrl,
  });

  // Activating the active connection is a no-op, so the route needs no
  // separate intent to keep the session.
  test("activates the active connection when the URL matches it", () => {
    expect(resolve(linkTo(activeUrl), [active], active)).toEqual({
      kind: "activate",
      connection: active,
    });
  });

  test("activates a matching connection that is not active", () => {
    const inactiveUrl = "https://inactive.neptune.amazonaws.com";
    const inactive = storedConnection("Inactive", {
      queryEngine: "gremlin",
      graphDbUrl: inactiveUrl,
    });

    expect(resolve(linkTo(inactiveUrl), [active, inactive], active)).toEqual({
      kind: "activate",
      connection: inactive,
    });
  });

  test("creates rather than reusing the active connection when the link requests a different auth posture", () => {
    const intent = resolve(
      linkTo(activeUrl, "&awsRegion=us-east-1"),
      [active],
      active,
    );
    expect(intent.kind).toBe("create");
  });

  test("creates a new connection named from the link when nothing matches", () => {
    const intent = resolve(
      linkTo("https://brand-new.neptune.amazonaws.com", "&name=Brand+New"),
      [active],
      active,
    );
    expect(intent).toEqual({
      kind: "create",
      name: "Brand New",
      connection: expect.objectContaining({
        graphDbUrl: "https://brand-new.neptune.amazonaws.com",
      }),
    });
  });
  // Resolution reads the store when it runs, so a connection added after the
  // app started is still matched.
  test("resolves against the connections present when it is called", () => {
    const laterUrl = "https://later.neptune.amazonaws.com";
    const state = new DbState();
    state.applyTo(getAppStore());
    expect(resolveConnectionLink(linkTo(laterUrl)).kind).toBe("create");

    const later = storedConnection("Later", {
      queryEngine: "gremlin",
      graphDbUrl: laterUrl,
    });
    state.addInactiveConnection(later).applyTo(getAppStore());
    expect(resolveConnectionLink(linkTo(laterUrl))).toEqual({
      kind: "activate",
      connection: later,
    });
  });
});

describe("matching a link to a stored connection", () => {
  const graphUrl = "https://g-abc.us-west-2.neptune-graph.amazonaws.com";
  const openCypherGraph = storedConnection("Test", {
    queryEngine: "openCypher",
    graphDbUrl: graphUrl,
  });
  const gremlinCluster = storedConnection("Gremlin DB", {
    queryEngine: "gremlin",
    graphDbUrl: "https://my-cluster.neptune.amazonaws.com",
  });
  const connections = [openCypherGraph, gremlinCluster];

  test("finds match by graphDbUrl and queryEngine", () => {
    expect(
      activatedBy(linkTo(graphUrl, "&queryEngine=openCypher"), connections),
    ).toBe(openCypherGraph);
  });

  test("matches case-insensitively on graphDbUrl", () => {
    expect(
      activatedBy(
        linkTo(graphUrl.toUpperCase(), "&queryEngine=openCypher"),
        connections,
      ),
    ).toBe(openCypherGraph);
  });

  // Both sides are normalized, so a trailing slash or stray whitespace on
  // either the stored connection or the link still matches.
  describe("ignores a trailing slash and surrounding whitespace", () => {
    test.each([
      { stored: "https://host:8182/", link: "https://host:8182" },
      { stored: "https://host:8182", link: "https://host:8182/" },
      { stored: "  https://host:8182\n", link: "https://host:8182" },
      { stored: "https://host:8182", link: "  https://host:8182\n" },
    ])("stored $stored matches link $link", ({ stored, link }) => {
      const connection = storedConnection("Test", {
        queryEngine: "gremlin",
        graphDbUrl: stored,
      });
      expect(activatedBy(linkTo(link), [connection])).toBe(connection);
    });
  });

  // The rest of the app reads a stored connection without a queryEngine as
  // gremlin, so matching must too or the link offers a duplicate.
  test("matches a stored connection with no queryEngine against a gremlin link", () => {
    const legacy = storedConnection("Legacy", {
      graphDbUrl: "https://my-cluster.neptune.amazonaws.com",
    });
    expect(
      activatedBy(linkTo("https://my-cluster.neptune.amazonaws.com"), [legacy]),
    ).toBe(legacy);
  });

  test("does not match when queryEngine differs", () => {
    expect(
      activatedBy(linkTo(graphUrl, "&queryEngine=gremlin"), connections),
    ).toBeNull();
  });

  test("does not match an unknown graphDbUrl", () => {
    expect(
      activatedBy(linkTo("https://unknown.neptune.amazonaws.com"), connections),
    ).toBeNull();
  });

  describe("when several connections match", () => {
    const duplicateUrl = "https://dupe.neptune.amazonaws.com";
    const first = storedConnection("First", {
      queryEngine: "gremlin",
      graphDbUrl: duplicateUrl,
    });
    const production = storedConnection("Production", {
      queryEngine: "gremlin",
      graphDbUrl: duplicateUrl,
    });
    const duplicates = [first, production];

    test("prefers the active connection", () => {
      expect(
        activatedBy(
          linkTo(duplicateUrl, "&name=First"),
          duplicates,
          production,
        ),
      ).toBe(production);
    });

    test("tiebreaks by name when none is active", () => {
      expect(
        activatedBy(linkTo(duplicateUrl, "&name=Production"), duplicates),
      ).toBe(production);
    });

    test("falls back to the first match when none is active and no name matches", () => {
      expect(
        activatedBy(linkTo(duplicateUrl, "&name=Neither"), duplicates),
      ).toBe(first);
    });

    // A nameless link takes the hostname as its name, so reopening it returns
    // to the connection it created even after the user adds a hand-named one
    // to the same endpoint.
    test("a nameless link prefers the connection its own derived name created", () => {
      const fromLink = storedConnection("dupe.neptune.amazonaws.com", {
        queryEngine: "gremlin",
        graphDbUrl: duplicateUrl,
      });
      expect(activatedBy(linkTo(duplicateUrl), [first, fromLink])).toBe(
        fromLink,
      );
    });
  });

  describe("auth posture is part of connection identity", () => {
    const url = "https://iam.neptune.amazonaws.com";

    function connectionWithAuth(
      auth: Pick<
        ConnectionConfig,
        "proxyConnection" | "awsAuthEnabled" | "awsRegion" | "serviceType"
      >,
    ) {
      return storedConnection("Auth", {
        queryEngine: "gremlin",
        graphDbUrl: url,
        ...auth,
      });
    }

    const iamInUsEast1 = {
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
    } as const;

    // A Direct Connection is sent from the browser, which cannot sign, so it
    // never authenticates with IAM, whatever IAM fields it still carries.
    test("an IAM link does not match a Direct Connection", () => {
      const direct = connectionWithAuth({
        proxyConnection: false,
        ...iamInUsEast1,
      });
      expect(
        activatedBy(linkTo(url, "&awsRegion=us-east-1"), [direct]),
      ).toBeNull();
    });

    test("a link without IAM matches a Direct Connection", () => {
      const direct = connectionWithAuth({ proxyConnection: false });
      expect(activatedBy(linkTo(url), [direct])).toBe(direct);
    });

    test("an IAM link does not match a non-IAM connection", () => {
      const plain = connectionWithAuth({});
      expect(
        activatedBy(linkTo(url, "&awsRegion=us-east-1"), [plain]),
      ).toBeNull();
    });

    test("a service type without a region still matches a non-IAM connection", () => {
      const plain = connectionWithAuth({});
      expect(activatedBy(linkTo(url, "&serviceType=neptune-db"), [plain])).toBe(
        plain,
      );
    });

    test("a non-IAM link does not match an IAM connection", () => {
      const iam = connectionWithAuth(iamInUsEast1);
      expect(activatedBy(linkTo(url), [iam])).toBeNull();
    });

    test("IAM links with different regions do not match", () => {
      const west = connectionWithAuth({
        ...iamInUsEast1,
        awsRegion: "us-west-2",
      });
      expect(
        activatedBy(linkTo(url, "&awsRegion=us-east-1"), [west]),
      ).toBeNull();
    });

    // Neptune Analytics only accepts openCypher, so both sides use it to
    // leave service type as the only difference.
    test("IAM links with different service types do not match", () => {
      const analytics = storedConnection("Analytics", {
        queryEngine: "openCypher",
        graphDbUrl: url,
        ...iamInUsEast1,
        serviceType: "neptune-graph",
      });
      expect(
        activatedBy(
          linkTo(
            url,
            "&queryEngine=openCypher&awsRegion=us-east-1&serviceType=neptune-db",
          ),
          [analytics],
        ),
      ).toBeNull();
    });

    test("matches an IAM connection with the same region and service type", () => {
      const iam = connectionWithAuth(iamInUsEast1);
      expect(
        activatedBy(
          linkTo(url, "&awsRegion=us-east-1&serviceType=neptune-db"),
          [iam],
        ),
      ).toBe(iam);
    });

    test("a link without a service type matches an IAM connection on the default service type", () => {
      const iam = connectionWithAuth(iamInUsEast1);
      expect(activatedBy(linkTo(url, "&awsRegion=us-east-1"), [iam])).toBe(iam);
    });
  });
});

describe("the connection a link proposes", () => {
  const url = "https://g-xxx.neptune-graph.amazonaws.com";

  test("enables IAM when a region is given", () => {
    expect(
      proposedBy(
        linkTo(
          url,
          "&queryEngine=openCypher&awsRegion=us-west-2&serviceType=neptune-graph",
        ),
      ),
    ).toEqual({
      queryEngine: "openCypher",
      graphDbUrl: url,
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });
  });

  test("leaves IAM off when no region is given", () => {
    const connection = proposedBy(linkTo(url));

    expect(connection.awsAuthEnabled).toBe(false);
    expect(connection.serviceType).toBeUndefined();
  });

  test("carries serviceType without a region but leaves IAM off", () => {
    const connection = proposedBy(linkTo(url, "&serviceType=neptune-db"));

    expect(connection.awsAuthEnabled).toBe(false);
    expect(connection.serviceType).toBe("neptune-db");
  });

  test("enables IAM with a default service type when only a region is given", () => {
    const connection = proposedBy(linkTo(url, "&awsRegion=us-west-2"));

    expect(connection.awsAuthEnabled).toBe(true);
    expect(connection.awsRegion).toBe("us-west-2");
    expect(connection.serviceType).toBe("neptune-db");
  });
});
