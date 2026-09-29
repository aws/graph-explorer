import type { ConnectionConfig } from "@shared/types";

import {
  type ConfigurationId,
  createNewConfigurationId,
  type RawConfiguration,
} from "./ConfigurationProvider";
import {
  readConnectionLink,
  resolveConnectionLinkIntent,
} from "./connectionLink";
import { ConnectionLinkError } from "./connectionLinkError";

/** The problems of an invalid link, as `param requirement` strings. */
function problemsOf(search: string) {
  const link = readConnectionLink(search);
  if (link.kind !== "invalid") {
    throw new Error(`Expected an invalid link, got "${link.kind}"`);
  }
  return link.error.problems.map(
    problem => `${problem.param} ${problem.requirement}`,
  );
}

function paramsOf(search: string) {
  const link = readConnectionLink(search);
  if (link.kind !== "valid") {
    throw new Error(`Expected a valid link, got "${link.kind}"`);
  }
  return link.params;
}

describe("readConnectionLink", () => {
  // The `#/connect` route exists only for connection links, so reaching it
  // without a graphDbUrl is an invalid link worth telling the user about,
  // rather than a silent no-op.
  test("is invalid when graphDbUrl is missing", () => {
    expect(problemsOf("")).toEqual(["graphDbUrl is required"]);
    expect(problemsOf("?queryEngine=openCypher")).toEqual([
      "graphDbUrl is required",
    ]);
  });

  test("is invalid when graphDbUrl is present but empty", () => {
    expect(problemsOf("?graphDbUrl=")).toEqual(["graphDbUrl is required"]);
  });

  // Both the missing param and the other bad param are reported together, so
  // the user sees everything wrong with the link in one notification.
  test("reports a missing graphDbUrl alongside other bad params", () => {
    expect(problemsOf("?queryEngine=sql")).toEqual([
      "graphDbUrl is required",
      'queryEngine must be one of "gremlin", "openCypher", "sparql"',
    ]);
  });

  test("parses graphDbUrl with defaults", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.us-west-2.neptune-graph.amazonaws.com",
      ),
    ).toEqual({
      graphDbUrl: "https://g-xxx.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "g-xxx.us-west-2.neptune-graph.amazonaws.com",
    });
  });

  test("falls back to the hostname when name is present but empty", () => {
    expect(
      paramsOf("?graphDbUrl=https%3A%2F%2Fdb.example.com&name=").name,
    ).toBe("db.example.com");
  });

  test("derives the name from the full hostname (without the port) when name is absent", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fmy-cluster.us-east-1.neptune.amazonaws.com%3A8182",
      ).name,
    ).toBe("my-cluster.us-east-1.neptune.amazonaws.com");
  });

  test("parses all parameters", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=openCypher&awsRegion=us-west-2&serviceType=neptune-graph&name=My+Graph",
      ),
    ).toEqual({
      graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
      queryEngine: "openCypher",
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
      name: "My Graph",
    });
  });

  // Each problem names the parameter at fault, so the user is told what to fix
  // rather than that the link was generically bad.
  test("reports which parameter failed and what it requires", () => {
    expect(problemsOf("?graphDbUrl=not-a-url")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
  });

  test("rejects a graphDbUrl that is not http(s)", () => {
    expect(problemsOf("?graphDbUrl=javascript%3Aalert(1)")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
    expect(problemsOf("?graphDbUrl=ftp%3A%2F%2Fexample.com")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
  });

  // `fetch` refuses a URL carrying credentials (the Request constructor throws
  // a TypeError), so such a link could only ever produce a connection that
  // fails every query — while writing the password into IndexedDB and any
  // exported connection file on the way.
  test("rejects a graphDbUrl carrying credentials", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent("https://user:secret@my-cluster.neptune.amazonaws.com:8182")}`,
      ),
    ).toEqual(["graphDbUrl cannot include a username or password"]);
  });

  test("rejects a graphDbUrl carrying only a username", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent("https://user@my-cluster.neptune.amazonaws.com:8182")}`,
      ),
    ).toEqual(["graphDbUrl cannot include a username or password"]);
  });

  // WHATWG URL parsing treats a backslash as a forward slash for http(s)
  // URLs, so this parses with an empty username and host `evil.tld` — passing
  // `url()` and the plain credentials check, while a reader sees a trusted
  // Neptune host after the `\@`.
  test("rejects a graphDbUrl that hides credentials behind a backslash", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://evil.tld\\@prod.cluster-abc.us-east-1.neptune.amazonaws.com:8182",
        )}`,
      ),
    ).toEqual(["graphDbUrl cannot contain a backslash"]);
  });

  test("accepts an explicit default port", () => {
    expect(
      paramsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://g-abc.us-east-1.neptune-graph.amazonaws.com:443",
        )}`,
      ).graphDbUrl,
    ).toBe("https://g-abc.us-east-1.neptune-graph.amazonaws.com:443");
  });

  test("accepts ordinary URLs", () => {
    expect(
      paramsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://my-cluster.us-east-1.neptune.amazonaws.com:8182",
        )}`,
      ).graphDbUrl,
    ).toBe("https://my-cluster.us-east-1.neptune.amazonaws.com:8182");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("http://localhost:8182")}`)
        .graphDbUrl,
    ).toBe("http://localhost:8182");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("https://host:8182/sparql")}`)
        .graphDbUrl,
    ).toBe("https://host:8182/sparql");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("https://host:8182/")}`)
        .graphDbUrl,
    ).toBe("https://host:8182/");
  });

  // A link naming a query engine or service type we do not support asked for
  // something we cannot deliver. Coercing it to a default would connect with a
  // different query language than the caller requested, so it is rejected and
  // the user is told the link was bad.
  test("rejects an unsupported queryEngine instead of defaulting it", () => {
    expect(
      problemsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=sql",
      ),
    ).toEqual(['queryEngine must be one of "gremlin", "openCypher", "sparql"']);
  });

  // Neptune Analytics only speaks openCypher, so the create form always
  // forces it and disables the picker. A link omitting queryEngine must
  // resolve to the same value the form would have forced, rather than the
  // general gremlin default.
  describe("queryEngine default depends on serviceType", () => {
    test("defaults to openCypher for neptune-graph when queryEngine is omitted", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph",
        ).queryEngine,
      ).toBe("openCypher");
    });

    test("rejects gremlin for neptune-graph rather than silently switching engines", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph&queryEngine=gremlin",
        ),
      ).toEqual([
        'queryEngine must be "openCypher" when serviceType is "neptune-graph"',
      ]);
    });

    test("accepts openCypher for neptune-graph", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph&queryEngine=openCypher",
        ).queryEngine,
      ).toBe("openCypher");
    });

    // Neptune Analytics only accepts IAM-signed requests, so a link to it
    // without a region could only build a connection that fails every query.
    test("rejects neptune-graph without an awsRegion", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=neptune-graph",
        ),
      ).toEqual(['awsRegion is required when serviceType is "neptune-graph"']);
    });

    test("defaults to gremlin for neptune-db when queryEngine is omitted", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune.amazonaws.com&serviceType=neptune-db",
        ).queryEngine,
      ).toBe("gremlin");
    });
  });

  test("rejects an unsupported serviceType instead of dropping it", () => {
    expect(
      problemsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=bogus",
      ),
    ).toEqual(['serviceType must be one of "neptune-db", "neptune-graph"']);
  });

  describe("awsRegion format", () => {
    test.each([
      "us-east-1",
      "us-gov-west-1",
      "ap-southeast-2",
      "eu-central-1",
      "cn-north-1",
    ])("accepts %s", region => {
      expect(
        paramsOf(
          `?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=${region}`,
        ).awsRegion,
      ).toBe(region);
    });

    test("rejects a value that isn't shaped like an AWS region", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=x",
        ),
      ).toEqual(['awsRegion must be an AWS region like "us-east-1"']);
    });

    test("rejects a region-shaped value with the wrong case", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=US-EAST-1",
        ),
      ).toEqual(['awsRegion must be an AWS region like "us-east-1"']);
    });

    // An absent or empty awsRegion still means IAM off, not a bad value.
    test("accepts an absent or empty awsRegion", () => {
      expect(
        paramsOf("?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com")
          .awsRegion,
      ).toBe("");
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=",
        ).awsRegion,
      ).toBe("");
    });
  });

  test("reports every offending parameter, not just the first", () => {
    expect(
      problemsOf("?graphDbUrl=not-a-url&queryEngine=sql&serviceType=bogus"),
    ).toHaveLength(3);
  });
});

function storedConnection(
  displayLabel: string,
  connection: ConnectionConfig,
): RawConfiguration {
  return { id: createNewConfigurationId(), displayLabel, connection };
}

function linkTo(graphDbUrl: string, otherParams = "") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}${otherParams}`;
}

function resolve(
  search: string,
  connections: RawConfiguration[],
  activeId: ConfigurationId | null = null,
) {
  return resolveConnectionLinkIntent(
    readConnectionLink(search),
    new Map(connections.map(config => [config.id, config])),
    activeId,
  );
}

/** The stored connection a valid link activates, or null when it creates one. */
function activatedBy(
  search: string,
  connections: RawConfiguration[],
  activeId: ConfigurationId | null = null,
) {
  const intent = resolve(search, connections, activeId);
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

describe("resolveConnectionLinkIntent", () => {
  const activeUrl = "https://active.neptune.amazonaws.com";
  const active = storedConnection("Active", {
    queryEngine: "gremlin",
    graphDbUrl: activeUrl,
  });

  test("passes an invalid link through with its error", () => {
    const intent = resolve("?graphDbUrl=not-a-url", [active], active.id);

    expect(intent).toEqual({
      kind: "invalid",
      error: expect.any(ConnectionLinkError),
    });
    expect(intent.kind === "invalid" && intent.error.problems).toEqual([
      { param: "graphDbUrl", requirement: "must be a valid http or https URL" },
    ]);
  });

  // Activating the active connection is a no-op, so the route needs no
  // separate intent to keep the session.
  test("activates the active connection when the URL matches it", () => {
    expect(resolve(linkTo(activeUrl), [active], active.id)).toEqual({
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

    expect(resolve(linkTo(inactiveUrl), [active, inactive], active.id)).toEqual(
      { kind: "activate", connection: inactive },
    );
  });

  test("creates rather than reusing the active connection when the link requests a different auth posture", () => {
    const intent = resolve(
      linkTo(activeUrl, "&awsRegion=us-east-1"),
      [active],
      active.id,
    );
    expect(intent.kind).toBe("create");
  });

  test("creates a new connection named from the link when nothing matches", () => {
    const intent = resolve(
      linkTo("https://brand-new.neptune.amazonaws.com", "&name=Brand+New"),
      [active],
      active.id,
    );
    expect(intent).toEqual({
      kind: "create",
      name: "Brand New",
      connection: expect.objectContaining({
        graphDbUrl: "https://brand-new.neptune.amazonaws.com",
      }),
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
          production.id,
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
