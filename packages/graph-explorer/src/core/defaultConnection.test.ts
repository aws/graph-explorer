// @vitest-environment happy-dom
import {
  createRandomBoolean,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";

import {
  createRandomAwsRegion,
  createRandomQueryEngine,
  createRandomServiceType,
} from "@/utils/testing";

import {
  DefaultConnectionDataSchema,
  fetchDefaultConnection,
  mapToConnection,
} from "./defaultConnection";

describe("fetchDefaultConnection", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    document.head.innerHTML = '<base href="http://localhost/explorer/" />';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should fetch from a single relative URL", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          GRAPH_EXP_CONNECTION_URL: "https://db.example.com:8182",
          GRAPH_EXP_GRAPH_TYPE: "gremlin",
          GRAPH_EXP_IAM: true,
          GRAPH_EXP_AWS_REGION: "us-east-1",
        }),
        { status: 200 },
      ),
    );

    const result = await fetchDefaultConnection();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "http://localhost/defaultConnection",
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].connection?.graphDbUrl).toBe(
      "https://db.example.com:8182",
    );
  });

  test("should not fall back to sagemaker path", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 404 }));

    const result = await fetchDefaultConnection();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(0);
  });

  test("should return all query engines when none specified", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          GRAPH_EXP_CONNECTION_URL: "https://db.example.com:8182",
          GRAPH_EXP_IAM: false,
        }),
        { status: 200 },
      ),
    );

    const result = await fetchDefaultConnection();

    expect(result).toHaveLength(3);
    expect(result.map(c => c.connection?.queryEngine)).toEqual([
      "gremlin",
      "openCypher",
      "sparql",
    ]);
  });
});

describe("mapToConnection", () => {
  test("should map default connection data to connection config", () => {
    const defaultConnectionData = createRandomDefaultConnectionData();
    const actual = mapToConnection(defaultConnectionData);
    expect(actual).toEqual({
      id: "Default Connection",
      displayLabel: "Default Connection",
      connection: {
        graphDbUrl: defaultConnectionData.GRAPH_EXP_CONNECTION_URL,
        queryEngine: defaultConnectionData.GRAPH_EXP_GRAPH_TYPE,
        awsAuthEnabled: defaultConnectionData.GRAPH_EXP_IAM,
        awsRegion: defaultConnectionData.GRAPH_EXP_AWS_REGION,
        serviceType: defaultConnectionData.GRAPH_EXP_SERVICE_TYPE,
        fetchTimeoutMs: defaultConnectionData.GRAPH_EXP_FETCH_REQUEST_TIMEOUT,
        nodeExpansionLimit:
          defaultConnectionData.GRAPH_EXP_NODE_EXPANSION_LIMIT,
      },
    });
  });
});

describe("DefaultConnectionDataSchema", () => {
  test("should parse default connection data", () => {
    const data = createRandomDefaultConnectionData();
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual(data);
  });

  test("should handle missing values", () => {
    const data = {};
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual({
      GRAPH_EXP_CONNECTION_URL: "",
      GRAPH_EXP_IAM: false,
      GRAPH_EXP_AWS_REGION: "",
      GRAPH_EXP_SERVICE_TYPE: "neptune-db",
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 240000,
    });
  });

  test("should handle invalid service type", () => {
    const data: any = createRandomDefaultConnectionData();
    data.GRAPH_EXP_SERVICE_TYPE = createRandomName("serviceType");
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual({ ...data, GRAPH_EXP_SERVICE_TYPE: "neptune-db" });
  });

  test("should handle invalid URLs", () => {
    const data: any = createRandomDefaultConnectionData();
    data.GRAPH_EXP_CONNECTION_URL = createRandomName("connectionURL");
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual({
      ...data,
      GRAPH_EXP_CONNECTION_URL: "",
    });
  });

  test("should preserve path in GRAPH_EXP_CONNECTION_URL", () => {
    const data = {
      ...createRandomDefaultConnectionData(),
      GRAPH_EXP_CONNECTION_URL:
        "http://blazegraph:9999/blazegraph/namespace/kb",
    };
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual.GRAPH_EXP_CONNECTION_URL).toBe(
      "http://blazegraph:9999/blazegraph/namespace/kb",
    );
  });
});

function createRandomDefaultConnectionData() {
  return {
    GRAPH_EXP_CONNECTION_URL: createRandomUrlString(),
    GRAPH_EXP_GRAPH_TYPE: createRandomQueryEngine(),
    GRAPH_EXP_IAM: createRandomBoolean(),
    GRAPH_EXP_AWS_REGION: createRandomAwsRegion(),
    GRAPH_EXP_SERVICE_TYPE: createRandomServiceType(),
    GRAPH_EXP_FETCH_REQUEST_TIMEOUT: createRandomInteger(),
    GRAPH_EXP_NODE_EXPANSION_LIMIT: createRandomInteger(),
  };
}
