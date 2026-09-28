// @vitest-environment happy-dom
import { queryEngineOptions } from "@shared/types";
import {
  createRandomBoolean,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";

import { ReverseProxyMisconfiguredError } from "@/utils";
import {
  createRandomAwsRegion,
  createRandomQueryEngine,
  createRandomServiceType,
  stubDocumentUrl,
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
    stubDocumentUrl();
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

  test("returns a direct connection when the server is not the proxy for it", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          GRAPH_EXP_CONNECTION_URL: "https://db.example.com:8182",
          GRAPH_EXP_GRAPH_TYPE: "gremlin",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        }),
        { status: 200 },
      ),
    );

    const result = await fetchDefaultConnection();

    expect(result).toHaveLength(1);
    expect(result[0].connection).toMatchObject({
      graphDbUrl: "https://db.example.com:8182",
      proxyConnection: false,
    });
  });

  test("fetches the default connection from the API root under the SageMaker reverse-proxy prefix", async () => {
    stubDocumentUrl("https://nb.sagemaker.aws/proxy/9250/explorer/");
    mockFetch.mockResolvedValue(new Response("", { status: 404 }));

    await fetchDefaultConnection();

    expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        href: "https://nb.sagemaker.aws/proxy/9250/defaultConnection",
      }),
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

  test("expands into one connection per query language when no query engine is provided", async () => {
    const data = createRandomDefaultConnectionData();
    delete (data as { GRAPH_EXP_GRAPH_TYPE?: string }).GRAPH_EXP_GRAPH_TYPE;
    stubDefaultConnectionResponse(data);

    const configs = await fetchDefaultConnection();

    expect(configs.map(config => config.connection?.queryEngine)).toEqual([
      ...queryEngineOptions,
    ]);
    expect(configs.map(config => config.id)).toEqual(
      queryEngineOptions.map(engine => `Default Connection-${engine}`),
    );
  });

  test("returns a single connection when a query engine is provided", async () => {
    const data = createRandomDefaultConnectionData();
    data.GRAPH_EXP_GRAPH_TYPE = "gremlin";
    stubDefaultConnectionResponse(data);

    const configs = await fetchDefaultConnection();

    expect(configs).toHaveLength(1);
    expect(configs[0].connection?.queryEngine).toBe("gremlin");
    expect(configs[0].id).toBe("Default Connection");
  });

  test("rejects when a reverse proxy renamed the mount path", async () => {
    stubDocumentUrl("https://example.com/renamed/");

    await expect(fetchDefaultConnection()).rejects.toBeInstanceOf(
      ReverseProxyMisconfiguredError,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("mapToConnection", () => {
  test("should map default connection data to connection config", () => {
    const defaultConnectionData = createRandomDefaultConnectionData();
    const actual = mapToConnection(defaultConnectionData);
    expect(actual).toStrictEqual({
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

  test("should mark a connection the server doesn't proxy as direct", () => {
    const defaultConnectionData = {
      ...createRandomDefaultConnectionData(),
      GRAPH_EXP_USING_PROXY_SERVER: false,
    };
    const actual = mapToConnection(defaultConnectionData);
    expect(actual.connection?.proxyConnection).toBe(false);
  });
});

/**
 * Earlier versions wrote `defaultConnection.json` with both endpoints and the
 * proxy flag:
 *
 *   { GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT, GRAPH_EXP_USING_PROXY_SERVER,
 *     GRAPH_EXP_CONNECTION_URL, GRAPH_EXP_IAM, ... }
 *
 * A stale file from an older container, or one written by hand, can still be
 * served. It must resolve exactly like a legacy stored connection does through
 * `transformLegacyConnection`. Do not delete without confirming no deployment
 * serves the old shape.
 */
describe("backward compatibility: main-era defaultConnection.json", () => {
  const publicEndpoint = "https://public.example.com:8182";
  const connectionUrl = "https://db.example.com:8182";

  function readFile(file: Record<string, unknown>) {
    return mapToConnection(DefaultConnectionDataSchema.parse(file)).connection;
  }

  function createMainEraFile() {
    return {
      GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: publicEndpoint,
      GRAPH_EXP_SERVICE_TYPE: "neptune-db",
      GRAPH_EXP_GRAPH_TYPE: "gremlin",
      GRAPH_EXP_IAM: true,
      GRAPH_EXP_CONNECTION_URL: connectionUrl,
      GRAPH_EXP_AWS_REGION: "us-west-2",
    };
  }

  test("proxies to the connection URL and keeps IAM when the flag is true", () => {
    const connection = readFile({
      ...createMainEraFile(),
      GRAPH_EXP_USING_PROXY_SERVER: true,
    });

    expect(connection).toStrictEqual({
      graphDbUrl: connectionUrl,
      queryEngine: "gremlin",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-db",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
    });
  });

  test("connects directly to the public endpoint and drops IAM when the flag is false", () => {
    const connection = readFile({
      ...createMainEraFile(),
      GRAPH_EXP_USING_PROXY_SERVER: false,
    });

    expect(connection).toStrictEqual({
      graphDbUrl: publicEndpoint,
      proxyConnection: false,
      queryEngine: "gremlin",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
    });
  });

  // Earlier versions defaulted a missing flag to false for this file
  test("connects directly to the public endpoint when the flag is absent and both URLs are set", () => {
    const connection = readFile(createMainEraFile());

    expect(connection).toStrictEqual({
      graphDbUrl: publicEndpoint,
      proxyConnection: false,
      queryEngine: "gremlin",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
    });
  });

  test("connects directly to the public endpoint when the flag is absent and it's the only URL", () => {
    const { GRAPH_EXP_CONNECTION_URL: _, ...file } = createMainEraFile();

    const connection = readFile(file);

    expect(connection).toStrictEqual({
      graphDbUrl: publicEndpoint,
      proxyConnection: false,
      queryEngine: "gremlin",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
    });
  });

  // Earlier versions wrote an empty GRAPH_EXP_CONNECTION_URL when
  // GRAPH_CONNECTION_URL was unset
  test.each([
    ["empty", ""],
    ["invalid", "not a url"],
  ])(
    "connects directly to the public endpoint when the flag is absent and the connection URL is %s",
    (_, value) => {
      const connection = readFile({
        ...createMainEraFile(),
        GRAPH_EXP_CONNECTION_URL: value,
      });

      expect(connection).toStrictEqual({
        graphDbUrl: publicEndpoint,
        proxyConnection: false,
        queryEngine: "gremlin",
        fetchTimeoutMs: 240000,
        nodeExpansionLimit: undefined,
      });
    },
  );

  test("maps a proxied file the current shell writes", () => {
    const connection = readFile({
      GRAPH_EXP_CONNECTION_URL: connectionUrl,
      GRAPH_EXP_GRAPH_TYPE: "openCypher",
      GRAPH_EXP_SERVICE_TYPE: "neptune-graph",
      GRAPH_EXP_IAM: true,
      GRAPH_EXP_AWS_REGION: "us-west-2",
      GRAPH_EXP_USING_PROXY_SERVER: true,
    });

    expect(connection).toStrictEqual({
      graphDbUrl: connectionUrl,
      queryEngine: "openCypher",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
    });
  });

  test("maps a direct file the current shell writes", () => {
    const connection = readFile({
      GRAPH_EXP_CONNECTION_URL: publicEndpoint,
      GRAPH_EXP_GRAPH_TYPE: "gremlin",
      GRAPH_EXP_USING_PROXY_SERVER: false,
    });

    expect(connection).toStrictEqual({
      graphDbUrl: publicEndpoint,
      proxyConnection: false,
      queryEngine: "gremlin",
      fetchTimeoutMs: 240000,
      nodeExpansionLimit: undefined,
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
      GRAPH_EXP_CONNECTION_URL: undefined,
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

function stubDefaultConnectionResponse(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

function createRandomDefaultConnectionData() {
  return {
    GRAPH_EXP_USING_PROXY_SERVER: true,
    GRAPH_EXP_CONNECTION_URL: createRandomUrlString(),
    GRAPH_EXP_GRAPH_TYPE: createRandomQueryEngine(),
    GRAPH_EXP_IAM: createRandomBoolean(),
    GRAPH_EXP_AWS_REGION: createRandomAwsRegion(),
    GRAPH_EXP_SERVICE_TYPE: createRandomServiceType(),
    GRAPH_EXP_FETCH_REQUEST_TIMEOUT: createRandomInteger(),
    GRAPH_EXP_NODE_EXPANSION_LIMIT: createRandomInteger(),
  };
}
