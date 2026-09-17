import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import {
  parseUrlConnectionParams,
  findMatchingConnection,
  buildConnectionFromParams,
  deriveProxyBaseUrl,
  resolveUrlConnectionIntent,
  type UrlConnectionParams,
} from "./urlConnectionParams";

describe("parseUrlConnectionParams", () => {
  test("returns null when graphDbUrl is missing", () => {
    expect(parseUrlConnectionParams("")).toBeNull();
    expect(parseUrlConnectionParams("?queryEngine=openCypher")).toBeNull();
  });

  test("parses graphDbUrl with defaults", () => {
    const result = parseUrlConnectionParams(
      "?graphDbUrl=https%3A%2F%2Fg-xxx.us-west-2.neptune-graph.amazonaws.com",
    );
    expect(result).toEqual({
      graphDbUrl: "https://g-xxx.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "g-xxx.us-west-2.neptune-graph.amazonaws.com",
    });
  });

  test("derives the name from the full hostname (without the port) when name is absent", () => {
    const result = parseUrlConnectionParams(
      "?graphDbUrl=https%3A%2F%2Fmy-cluster.us-east-1.neptune.amazonaws.com%3A8182",
    );
    expect(result?.name).toBe("my-cluster.us-east-1.neptune.amazonaws.com");
  });

  test("returns null when graphDbUrl is not a valid URL", () => {
    expect(parseUrlConnectionParams("?graphDbUrl=not-a-url")).toBeNull();
  });

  test("returns null when graphDbUrl is not an http(s) URL", () => {
    expect(
      parseUrlConnectionParams(
        "?graphDbUrl=javascript%3Aalert(1)&queryEngine=gremlin",
      ),
    ).toBeNull();
    expect(
      parseUrlConnectionParams(
        "?graphDbUrl=ftp%3A%2F%2Fexample.com&queryEngine=gremlin",
      ),
    ).toBeNull();
  });

  test("parses all parameters", () => {
    const result = parseUrlConnectionParams(
      "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=openCypher&awsRegion=us-west-2&serviceType=neptune-graph&name=My+Graph",
    );
    expect(result).toEqual({
      graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
      queryEngine: "openCypher",
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
      name: "My Graph",
    });
  });

  test("falls back to gremlin when queryEngine is invalid", () => {
    const result = parseUrlConnectionParams(
      "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=sql",
    );
    expect(result?.queryEngine).toBe("gremlin");
  });

  test("drops invalid serviceType", () => {
    const result = parseUrlConnectionParams(
      "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=bogus",
    );
    expect(result?.serviceType).toBeUndefined();
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
    }): UrlConnectionParams => ({
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

    expect(connection.displayLabel).toBe("My Graph");
    expect(connection.connection).toEqual({
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

    expect(connection.connection?.awsAuthEnabled).toBe(false);
    expect(connection.connection?.serviceType).toBeUndefined();
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

    expect(connection.connection?.awsAuthEnabled).toBe(true);
    expect(connection.connection?.awsRegion).toBe("us-west-2");
    expect(connection.connection?.serviceType).toBe("neptune-db");
  });

  test("generates a unique id per call", () => {
    const params = {
      graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
      queryEngine: "openCypher" as const,
      awsRegion: "",
      serviceType: undefined,
      name: "A",
    };
    const a = buildConnectionFromParams(params, "https://localhost");
    const b = buildConnectionFromParams(params, "https://localhost");
    expect(a.id).not.toBe(b.id);
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

describe("resolveUrlConnectionIntent", () => {
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

  const paramsFor = (graphDbUrl: string): UrlConnectionParams => ({
    graphDbUrl,
    queryEngine: "gremlin",
    awsRegion: "",
    serviceType: undefined,
    name: "Whatever",
  });

  test("is a no-op when the URL matches the active connection", () => {
    const intent = resolveUrlConnectionIntent(
      paramsFor(activeUrl),
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

    const intent = resolveUrlConnectionIntent(
      paramsFor(inactiveUrl),
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
    const intent = resolveUrlConnectionIntent(
      { ...paramsFor(activeUrl), awsRegion: "us-east-1" },
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent.kind).toBe("create");
  });

  test("creates a new connection when nothing matches", () => {
    const intent = resolveUrlConnectionIntent(
      paramsFor("https://brand-new.neptune.amazonaws.com"),
      configs,
      activeId,
      "https://localhost",
    );
    expect(intent.kind).toBe("create");
  });
});
