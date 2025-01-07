import {
  createRandomBoolean,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";
import {
  DefaultConnectionDataSchema,
  mapToConnection,
} from "./defaultConnection";
import {
  createRandomAwsRegion,
  createRandomQueryEngine,
  createRandomServiceType,
} from "@/utils/testing";

describe("mapToConnection", () => {
  test("should map default connection data to connection config", () => {
    const defaultConnectionData = createRandomDefaultConnectionData();
    const actual = mapToConnection(defaultConnectionData);
    expect(actual).toEqual({
      id: "Default Connection",
      displayLabel: "Default Connection",
      connection: {
        graphDbUrl: defaultConnectionData.GRAPH_EXP_CONNECTION_URL,
        url: defaultConnectionData.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT,
        proxyConnection: defaultConnectionData.GRAPH_EXP_USING_PROXY_SERVER,
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
      GRAPH_EXP_USING_PROXY_SERVER: false,
      GRAPH_EXP_CONNECTION_URL: "",
      GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: "",
      GRAPH_EXP_IAM: false,
      GRAPH_EXP_AWS_REGION: "",
      GRAPH_EXP_SERVICE_TYPE: "neptune-db",
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 240000,
    });
  });

  test("should handle invalid service type", () => {
    const data: any = createRandomDefaultConnectionData();
    data.GRAPH_EXP_SERVICE_TYPE = createRandomName("serviceType");
    // Make the enum less strict
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual({ ...data, GRAPH_EXP_SERVICE_TYPE: "neptune-db" });
  });

  test("should handle invalid URLs", () => {
    const data: any = createRandomDefaultConnectionData();
    data.GRAPH_EXP_CONNECTION_URL = createRandomName("connectionURL");
    data.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT = createRandomName(
      "publicOrProxyEndpoint"
    );
    // Make the enum less strict
    const actual = DefaultConnectionDataSchema.parse(data);
    expect(actual).toEqual({
      ...data,
      GRAPH_EXP_CONNECTION_URL: "",
      GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: "",
    });
  });
});

function createRandomDefaultConnectionData() {
  return {
    GRAPH_EXP_USING_PROXY_SERVER: createRandomBoolean(),
    GRAPH_EXP_CONNECTION_URL: createRandomUrlString(),
    GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: createRandomUrlString(),
    GRAPH_EXP_GRAPH_TYPE: createRandomQueryEngine(),
    GRAPH_EXP_IAM: createRandomBoolean(),
    GRAPH_EXP_AWS_REGION: createRandomAwsRegion(),
    GRAPH_EXP_SERVICE_TYPE: createRandomServiceType(),
    GRAPH_EXP_FETCH_REQUEST_TIMEOUT: createRandomInteger(),
    GRAPH_EXP_NODE_EXPANSION_LIMIT: createRandomInteger(),
  };
}
