import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import {
  parseUrlConnectionParams,
  findMatchingConnection,
  buildConnectionFromParams,
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
      serviceType: "",
      name: "https://g-xxx.us-west-2.neptune-graph.amazonaws.com",
    });
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
      serviceType: "",
      name: "",
    });
    expect(match?.id).toBe("conn-1");
  });

  test("matches case-insensitively on graphDbUrl", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://G-ABC.US-WEST-2.NEPTUNE-GRAPH.AMAZONAWS.COM",
      queryEngine: "openCypher",
      awsRegion: "",
      serviceType: "",
      name: "",
    });
    expect(match?.id).toBe("conn-1");
  });

  test("returns null when queryEngine differs", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://g-abc.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: "",
      name: "",
    });
    expect(match).toBeNull();
  });

  test("returns null when no match", () => {
    const match = findMatchingConnection(configs, {
      graphDbUrl: "https://unknown.neptune.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: "",
      name: "",
    });
    expect(match).toBeNull();
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

    expect(connection.id).toBe(
      "url-https://g-xxx.neptune-graph.amazonaws.com-openCypher",
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

  test("builds connection with IAM disabled when region/serviceType missing", () => {
    const connection = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "gremlin",
        awsRegion: "",
        serviceType: "",
        name: "No IAM",
      },
      "https://localhost",
    );

    expect(connection.connection?.awsAuthEnabled).toBe(false);
    expect(connection.connection?.serviceType).toBeUndefined();
  });

  test("generates deterministic ID", () => {
    const a = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "openCypher",
        awsRegion: "",
        serviceType: "",
        name: "A",
      },
      "https://localhost",
    );
    const b = buildConnectionFromParams(
      {
        graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
        queryEngine: "openCypher",
        awsRegion: "",
        serviceType: "",
        name: "B",
      },
      "https://localhost",
    );
    expect(a.id).toBe(b.id);
  });
});
