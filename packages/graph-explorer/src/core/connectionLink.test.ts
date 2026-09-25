import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import {
  buildConnectionFromParams,
  deriveProxyBaseUrl,
  findMatchingConnection,
  readConnectionLink,
  resolveConnectionLinkIntent,
  type ConnectionLinkParams,
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
  test("is absent when graphDbUrl is missing", () => {
    expect(readConnectionLink("")).toEqual({ kind: "absent" });
    expect(readConnectionLink("?queryEngine=openCypher")).toEqual({
      kind: "absent",
    });
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
    ).toEqual(["graphDbUrl must be written exactly as the URL it resolves to"]);
  });

  test("accepts ordinary URLs that round-trip through href unchanged", () => {
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

  test("rejects an unsupported serviceType instead of dropping it", () => {
    expect(
      problemsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=bogus",
      ),
    ).toEqual(['serviceType must be one of "neptune-db", "neptune-graph"']);
  });

  test("reports every offending parameter, not just the first", () => {
    expect(
      problemsOf("?graphDbUrl=not-a-url&queryEngine=sql&serviceType=bogus"),
    ).toHaveLength(3);
  });
});

describe("findMatchingConnection", () => {
  const configs = new Map<ConfigurationId, RawConfiguration>([
    [
      "conn-1" as ConfigurationId,
      {
        id: "conn-1" as ConfigurationId,
        displayLabel: "Test",
        connection: {
          url: "https://localhost",
          queryEngine: "openCypher",
          graphDbUrl: "https://g-abc.us-west-2.neptune-graph.amazonaws.com",
        },
      },
    ],
    [
      "conn-2" as ConfigurationId,
      {
        id: "conn-2" as ConfigurationId,
        displayLabel: "Gremlin DB",
        connection: {
          url: "https://localhost",
          queryEngine: "gremlin",
          graphDbUrl: "https://my-cluster.neptune.amazonaws.com",
        },
      },
    ],
  ]);

  test("finds match by graphDbUrl and queryEngine", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://g-abc.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "openCypher",
      awsRegion: "",
      serviceType: undefined,
      name: "",
    });
    expect(match?.id).toBe("conn-1");
  });

  test("matches case-insensitively on graphDbUrl", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://G-ABC.US-WEST-2.NEPTUNE-GRAPH.AMAZONAWS.COM",
      queryEngine: "openCypher",
      awsRegion: "",
      serviceType: undefined,
      name: "",
    });
    expect(match?.id).toBe("conn-1");
  });

  test("returns null when queryEngine differs", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://g-abc.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "",
    });
    expect(match).toBeNull();
  });

  test("returns null when no match", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://unknown.neptune.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "",
    });
    expect(match).toBeNull();
  });

  test("prefers the active connection when multiple match", () => {
    const duplicateUrl = "https://dupe.neptune.amazonaws.com";
    const dupes = new Map<ConfigurationId, RawConfiguration>([
      [
        "dupe-1" as ConfigurationId,
        {
          id: "dupe-1" as ConfigurationId,
          displayLabel: "First",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
      [
        "dupe-2" as ConfigurationId,
        {
          id: "dupe-2" as ConfigurationId,
          displayLabel: "Second",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
    ]);

    const match = findMatchingConnection(
      dupes,
      {
        graphDbUrl: duplicateUrl,
        queryEngine: "gremlin",
        awsRegion: "",
        serviceType: undefined,
        name: "",
      },
      "dupe-2" as ConfigurationId,
    );
    expect(match?.id).toBe("dupe-2");
  });

  describe("auth posture is part of connection identity", () => {
    const url = "https://iam.neptune.amazonaws.com";

    const iamConfig = (
      id: string,
      auth: {
        awsAuthEnabled?: boolean;
        awsRegion?: string;
        serviceType?: "neptune-db" | "neptune-graph";
      },
    ): [ConfigurationId, RawConfiguration] => [
      id as ConfigurationId,
      {
        id: id as ConfigurationId,
        displayLabel: id,
        connection: {
          url: "https://localhost",
          queryEngine: "gremlin",
          graphDbUrl: url,
          ...auth,
        },
      },
    ];

    const paramsWith = (auth: {
      awsRegion?: string;
      serviceType?: "neptune-db" | "neptune-graph";
    }): ConnectionLinkParams => ({
      graphDbUrl: url,
      queryEngine: "gremlin",
      awsRegion: auth.awsRegion ?? "",
      serviceType: auth.serviceType,
      name: "",
    });

    test("an IAM link does not match a non-IAM connection", () => {
      const configs = new Map([iamConfig("plain", {})]);
      const match = findMatchingConnection(
        configs,
        paramsWith({ awsRegion: "us-east-1" }),
      );
      expect(match).toBeNull();
    });

    test("a non-IAM link does not match an IAM connection", () => {
      const configs = new Map([
        iamConfig("iam", {
          awsAuthEnabled: true,
          awsRegion: "us-east-1",
          serviceType: "neptune-db",
        }),
      ]);
      const match = findMatchingConnection(configs, paramsWith({}));
      expect(match).toBeNull();
    });

    test("IAM links with different regions do not match", () => {
      const configs = new Map([
        iamConfig("west", {
          awsAuthEnabled: true,
          awsRegion: "us-west-2",
          serviceType: "neptune-db",
        }),
      ]);
      const match = findMatchingConnection(
        configs,
        paramsWith({ awsRegion: "us-east-1" }),
      );
      expect(match).toBeNull();
    });

    test("IAM links with different service types do not match", () => {
      const configs = new Map([
        iamConfig("db", {
          awsAuthEnabled: true,
          awsRegion: "us-east-1",
          serviceType: "neptune-db",
        }),
      ]);
      const match = findMatchingConnection(
        configs,
        paramsWith({ awsRegion: "us-east-1", serviceType: "neptune-graph" }),
      );
      expect(match).toBeNull();
    });

    test("matches an IAM connection with the same region and service type", () => {
      const configs = new Map([
        iamConfig("match", {
          awsAuthEnabled: true,
          awsRegion: "us-east-1",
          serviceType: "neptune-db",
        }),
      ]);
      const match = findMatchingConnection(
        configs,
        paramsWith({ awsRegion: "us-east-1", serviceType: "neptune-db" }),
      );
      expect(match?.id).toBe("match");
    });

    test("a link without a service type matches an IAM connection on the default service type", () => {
      const configs = new Map([
        iamConfig("default", {
          awsAuthEnabled: true,
          awsRegion: "us-east-1",
          serviceType: "neptune-db",
        }),
      ]);
      const match = findMatchingConnection(
        configs,
        paramsWith({ awsRegion: "us-east-1" }),
      );
      expect(match?.id).toBe("default");
    });
  });

  test("tiebreaks by name when multiple match and none is active", () => {
    const duplicateUrl = "https://dupe.neptune.amazonaws.com";
    const dupes = new Map<ConfigurationId, RawConfiguration>([
      [
        "dupe-1" as ConfigurationId,
        {
          id: "dupe-1" as ConfigurationId,
          displayLabel: "First",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
      [
        "dupe-2" as ConfigurationId,
        {
          id: "dupe-2" as ConfigurationId,
          displayLabel: "Production",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
    ]);

    const match = findMatchingConnection(dupes, {
      graphDbUrl: duplicateUrl,
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "Production",
    });
    expect(match?.id).toBe("dupe-2");
  });

  // A nameless link identifies the connection it would have created, and the
  // name it would have created is the hostname. So when the user later adds a
  // second connection to the same endpoint under a name of their own, reopening
  // the original link returns to the original connection.
  test("a nameless link prefers the connection its own derived name created", () => {
    const duplicateUrl = "https://dupe.neptune.amazonaws.com";
    const params = paramsOf(`?graphDbUrl=${encodeURIComponent(duplicateUrl)}`);
    const dupes = new Map<ConfigurationId, RawConfiguration>([
      [
        "hand-named" as ConfigurationId,
        {
          id: "hand-named" as ConfigurationId,
          displayLabel: "My Cluster",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
      [
        "from-link" as ConfigurationId,
        {
          id: "from-link" as ConfigurationId,
          displayLabel: "dupe.neptune.amazonaws.com",
          connection: {
            url: "https://localhost",
            queryEngine: "gremlin",
            graphDbUrl: duplicateUrl,
          },
        },
      ],
    ]);

    // The hand-named connection is first in the map, so falling through to the
    // first match would return it.
    const match = findMatchingConnection(dupes, params);
    expect(match?.id).toBe("from-link");
  });
});

describe("buildConnectionFromParams", () => {
  test("builds connection with IAM enabled", () => {
    const connection = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "openCypher",
        awsRegion: "us-west-2",
        serviceType: "neptune-graph",
        name: "My Graph",
      },
      "https://localhost",
    );

    expect(connection).toEqual({
      url: "https://localhost",
      queryEngine: "openCypher",
      proxyConnection: true,
      graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });
  });

  test("builds connection with IAM disabled when no region is given", () => {
    const connection = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "gremlin",
        awsRegion: "",
        serviceType: undefined,
        name: "No IAM",
      },
      "https://localhost",
    );

    expect(connection.awsAuthEnabled).toBe(false);
    expect(connection.serviceType).toBeUndefined();
  });

  test("enables IAM with a default service type when only region is given", () => {
    const connection = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "gremlin",
        awsRegion: "us-west-2",
        serviceType: undefined,
        name: "Region Only",
      },
      "https://localhost",
    );

    expect(connection.awsAuthEnabled).toBe(true);
    expect(connection.awsRegion).toBe("us-west-2");
    expect(connection.serviceType).toBe("neptune-db");
  });
});

describe("deriveProxyBaseUrl", () => {
  test("climbs one level from a path-hosted notebook deployment", () => {
    expect(
      deriveProxyBaseUrl(
        "https://my-notebook.notebook.us-west-2.sagemaker.aws/proxy/9250/explorer/",
      ),
    ).toBe("https://my-notebook.notebook.us-west-2.sagemaker.aws/proxy/9250");
  });

  test("resolves to the origin for a root-hosted deployment", () => {
    expect(deriveProxyBaseUrl("https://localhost:5173/explorer/")).toBe(
      "https://localhost:5173",
    );
  });
});

describe("resolveConnectionLinkIntent", () => {
  const activeUrl = "https://active.neptune.amazonaws.com";
  const activeId = "active-conn" as ConfigurationId;
  const configs = new Map<ConfigurationId, RawConfiguration>([
    [
      activeId,
      {
        id: activeId,
        displayLabel: "Active",
        connection: {
          url: "https://localhost",
          queryEngine: "gremlin",
          graphDbUrl: activeUrl,
        },
      },
    ],
  ]);

  const paramsFor = (graphDbUrl: string): ConnectionLinkParams => ({
    graphDbUrl,
    queryEngine: "gremlin",
    awsRegion: "",
    serviceType: undefined,
    name: "Whatever",
  });

  const linkFor = (params: ConnectionLinkParams) =>
    ({ kind: "valid", params }) as const;

  test("is a no-op when there is no link at all", () => {
    const intent = resolveConnectionLinkIntent(
      { kind: "absent" },
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent).toEqual({ kind: "none" });
  });

  test("passes an invalid link through with its error", () => {
    const error = new ConnectionLinkError([
      { param: "graphDbUrl", requirement: "must be a valid http or https URL" },
    ]);
    const intent = resolveConnectionLinkIntent(
      { kind: "invalid", error },
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent).toEqual({ kind: "invalid", error });
  });

  test("is a no-op when the URL matches the active connection", () => {
    const intent = resolveConnectionLinkIntent(
      linkFor(paramsFor(activeUrl)),
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent).toEqual({ kind: "none" });
  });

  test("activates a matching connection that is not active", () => {
    const inactiveId = "inactive-conn" as ConfigurationId;
    const inactiveUrl = "https://inactive.neptune.amazonaws.com";
    const withInactive = new Map(configs);
    withInactive.set(inactiveId, {
      id: inactiveId,
      displayLabel: "Inactive",
      connection: {
        url: "https://localhost",
        queryEngine: "gremlin",
        graphDbUrl: inactiveUrl,
      },
    });

    const intent = resolveConnectionLinkIntent(
      linkFor(paramsFor(inactiveUrl)),
      withInactive,
      activeId,
      "https://localhost",
    );
    expect(intent).toEqual({
      kind: "activate",
      connection: withInactive.get(inactiveId),
    });
  });

  test("creates rather than reusing the active connection when the link requests a different auth posture", () => {
    const intent = resolveConnectionLinkIntent(
      linkFor({ ...paramsFor(activeUrl), awsRegion: "us-east-1" }),
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent.kind).toBe("create");
  });

  test("creates a new connection when nothing matches", () => {
    const intent = resolveConnectionLinkIntent(
      linkFor(paramsFor("https://brand-new.neptune.amazonaws.com")),
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent.kind).toBe("create");
  });
});
