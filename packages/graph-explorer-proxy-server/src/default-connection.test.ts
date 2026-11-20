import { describe, expect, it } from "vite-plus/test";

import type { ConfigJson } from "./config-json.ts";

import { renderDefaultConnection } from "./default-connection.ts";

type Row = {
  name: string;
  settings: ConfigJson["values"];
  /** The Default Connection the text parses to, or `undefined` when no connection is configured. */
  expected: Record<string, unknown> | undefined;
};

const db = "https://db:8182";

const rowGroups: Record<string, Row[]> = {
  "defaultConnection.json generation": [
    {
      name: "creates a Default Connection when GRAPH_CONNECTION_URL is set",
      settings: {
        GRAPH_CONNECTION_URL: db,
        GRAPH_TYPE: "gremlin",
        IAM: "false",
        AWS_REGION: "eu-west-1",
      },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_GRAPH_TYPE: "gremlin",
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "eu-west-1",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
    {
      name: "creates no Default Connection without GRAPH_CONNECTION_URL",
      settings: { GRAPH_TYPE: "gremlin" },
      expected: undefined,
    },
    {
      name: "defaults SERVICE_TYPE to neptune-db and IAM to false",
      settings: { GRAPH_CONNECTION_URL: db },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
    {
      name: "contains exactly the expected values when all values are provided",
      settings: {
        GRAPH_CONNECTION_URL: db,
        SERVICE_TYPE: "neptune-db",
        GRAPH_TYPE: "gremlin",
        IAM: "true",
        AWS_REGION: "us-east-1",
      },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_GRAPH_TYPE: "gremlin",
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: true,
        GRAPH_EXP_AWS_REGION: "us-east-1",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
  ],

  /**
   * BACKWARD COMPATIBILITY — LEGACY DEPLOYMENT INPUT
   *
   * Older deployments, and the SageMaker lifecycle script still in use today,
   * set `PUBLIC_OR_PROXY_ENDPOINT` and `USING_PROXY_SERVER` instead of the
   * current `GRAPH_CONNECTION_URL`. The Default Connection must keep
   * resolving those variables into `GRAPH_EXP_CONNECTION_URL` and
   * `GRAPH_EXP_USING_PROXY_SERVER`, whether they arrive alone, together with
   * the current variable, or via `config.json`, and must never carry
   * `PUBLIC_OR_PROXY_ENDPOINT` into the Default Connection. A connection that
   * resolves to direct stays a direct connection.
   *
   * DO NOT delete or weaken these tests without confirming that no deployment
   * still in the wild sets these legacy environment variables instead of
   * `GRAPH_CONNECTION_URL`.
   */
  "backward compatibility: legacy PUBLIC_OR_PROXY_ENDPOINT / USING_PROXY_SERVER resolution":
    [
      {
        name: "resolves to GRAPH_CONNECTION_URL when USING_PROXY_SERVER=true",
        settings: {
          USING_PROXY_SERVER: "true",
          GRAPH_CONNECTION_URL: "https://proxied:8182",
          PUBLIC_OR_PROXY_ENDPOINT: "https://ignored:9250",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://proxied:8182",
          GRAPH_EXP_SERVICE_TYPE: "neptune-db",
          GRAPH_EXP_IAM: false,
          GRAPH_EXP_AWS_REGION: "",
          GRAPH_EXP_USING_PROXY_SERVER: true,
        },
      },
      {
        // The variables install-graph-explorer-lc.sh passes to `docker run`.
        name: "resolves to a proxied IAM GRAPH_CONNECTION_URL for the SageMaker lifecycle script's environment",
        settings: {
          PUBLIC_OR_PROXY_ENDPOINT: "https://notebook.sagemaker.aws/proxy/9250",
          GRAPH_CONNECTION_URL: "https://neptune-cluster:8182",
          USING_PROXY_SERVER: "true",
          IAM: "true",
          AWS_REGION: "us-west-2",
          SERVICE_TYPE: "neptune-db",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://neptune-cluster:8182",
          GRAPH_EXP_SERVICE_TYPE: "neptune-db",
          GRAPH_EXP_IAM: true,
          GRAPH_EXP_AWS_REGION: "us-west-2",
          GRAPH_EXP_USING_PROXY_SERVER: true,
        },
      },
      {
        name: "resolves to a direct PUBLIC_OR_PROXY_ENDPOINT when USING_PROXY_SERVER=false and GRAPH_CONNECTION_URL is unset",
        settings: {
          USING_PROXY_SERVER: "false",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "resolves to a direct GRAPH_CONNECTION_URL when USING_PROXY_SERVER=false and PUBLIC_OR_PROXY_ENDPOINT is unset",
        settings: { USING_PROXY_SERVER: "false", GRAPH_CONNECTION_URL: db },
        expected: {
          GRAPH_EXP_CONNECTION_URL: db,
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "resolves to a direct PUBLIC_OR_PROXY_ENDPOINT when USING_PROXY_SERVER=false and both URLs are set",
        settings: {
          USING_PROXY_SERVER: "false",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
          GRAPH_CONNECTION_URL: db,
          IAM: "true",
          AWS_REGION: "us-east-1",
          SERVICE_TYPE: "neptune-db",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "keeps the openCypher query language on a direct neptune-graph connection",
        settings: {
          USING_PROXY_SERVER: "false",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
          SERVICE_TYPE: "neptune-graph",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_GRAPH_TYPE: "openCypher",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "resolves to a proxied GRAPH_CONNECTION_URL when USING_PROXY_SERVER is unset and only GRAPH_CONNECTION_URL is set",
        settings: { GRAPH_CONNECTION_URL: db },
        expected: {
          GRAPH_EXP_CONNECTION_URL: db,
          GRAPH_EXP_SERVICE_TYPE: "neptune-db",
          GRAPH_EXP_IAM: false,
          GRAPH_EXP_AWS_REGION: "",
          GRAPH_EXP_USING_PROXY_SERVER: true,
        },
      },
      {
        // Earlier versions treated an unset USING_PROXY_SERVER as false, so a
        // deployment that sets both URLs keeps its direct Default Connection.
        name: "resolves to a direct PUBLIC_OR_PROXY_ENDPOINT when USING_PROXY_SERVER is unset and both URLs are set",
        settings: {
          GRAPH_CONNECTION_URL: db,
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "resolves to a direct PUBLIC_OR_PROXY_ENDPOINT when both USING_PROXY_SERVER and GRAPH_CONNECTION_URL are unset",
        settings: { PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250" },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      },
      {
        name: "creates no Default Connection when USING_PROXY_SERVER=true and GRAPH_CONNECTION_URL is unset",
        settings: {
          USING_PROXY_SERVER: "true",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
        },
        expected: undefined,
      },
      {
        // Mixed case "True" must still be recognized as the proxy case. A
        // case-sensitive check would miss it, fall through to
        // PUBLIC_OR_PROXY_ENDPOINT, and wrongly produce a connection instead of
        // none.
        name: "resolves USING_PROXY_SERVER case-insensitively",
        settings: {
          USING_PROXY_SERVER: "True",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
        },
        expected: undefined,
      },
      {
        name: "resolves a mixed-case USING_PROXY_SERVER=True to a proxied GRAPH_CONNECTION_URL",
        settings: {
          USING_PROXY_SERVER: "True",
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
          GRAPH_CONNECTION_URL: db,
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: db,
          GRAPH_EXP_SERVICE_TYPE: "neptune-db",
          GRAPH_EXP_IAM: false,
          GRAPH_EXP_AWS_REGION: "",
          GRAPH_EXP_USING_PROXY_SERVER: true,
        },
      },
      // Only a case-insensitive "true" means proxied. Any other value is set, so
      // it doesn't fall back to inferring from the URLs, and resolves as direct.
      ...["yes", "1", "on", "null"].map((value): Row => ({
        name: `resolves USING_PROXY_SERVER=${value} to a direct PUBLIC_OR_PROXY_ENDPOINT`,
        settings: {
          USING_PROXY_SERVER: value,
          PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
          GRAPH_CONNECTION_URL: db,
          IAM: "true",
          AWS_REGION: "us-east-1",
          SERVICE_TYPE: "neptune-db",
        },
        expected: {
          GRAPH_EXP_CONNECTION_URL: "https://public:9250",
          GRAPH_EXP_USING_PROXY_SERVER: false,
        },
      })),
    ],

  "SERVICE_TYPE=neptune-graph auto-sets openCypher": [
    {
      name: "sets GRAPH_TYPE to openCypher when SERVICE_TYPE is neptune-graph",
      settings: { GRAPH_CONNECTION_URL: db, SERVICE_TYPE: "neptune-graph" },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_GRAPH_TYPE: "openCypher",
        GRAPH_EXP_SERVICE_TYPE: "neptune-graph",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
    {
      name: "does not set GRAPH_TYPE when SERVICE_TYPE is neptune-db and no GRAPH_TYPE is given",
      settings: { GRAPH_CONNECTION_URL: db, SERVICE_TYPE: "neptune-db" },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
    {
      name: "takes an explicit GRAPH_TYPE over the neptune-graph auto-detection",
      settings: {
        GRAPH_CONNECTION_URL: db,
        SERVICE_TYPE: "neptune-graph",
        GRAPH_TYPE: "sparql",
      },
      expected: {
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_GRAPH_TYPE: "sparql",
        GRAPH_EXP_SERVICE_TYPE: "neptune-graph",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    },
  ],

  "default values for optional fields": [
    {
      name: "creates no Default Connection when GRAPH_CONNECTION_URL is empty",
      settings: { GRAPH_CONNECTION_URL: "" },
      expected: undefined,
    },
    ...[
      "http://blazegraph:9999/blazegraph/namespace/kb",
      "http://blazegraph:9999/blazegraph/namespace/kb/",
    ].map((url): Row => ({
      name: `preserves ${url.endsWith("/") ? "a trailing slash" : "the path"} in GRAPH_CONNECTION_URL`,
      settings: { GRAPH_CONNECTION_URL: url },
      expected: {
        GRAPH_EXP_CONNECTION_URL: url,
        GRAPH_EXP_SERVICE_TYPE: "neptune-db",
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_AWS_REGION: "",
        GRAPH_EXP_USING_PROXY_SERVER: true,
      },
    })),
  ],

  // #2291: the shell never wrote these two settings.
};

/** The rendered Default Connection, parsed. */
function renderParsed(settings: ConfigJson["values"]): unknown {
  const text = renderDefaultConnection(settings);
  return text === undefined ? undefined : JSON.parse(text);
}

describe("renderDefaultConnection", () => {
  describe.for(Object.entries(rowGroups))("%s", ([_group, groupRows]) => {
    it.for(groupRows.map(row => [row.name, row] as const))(
      "%s",
      ([_name, { settings, expected }]) => {
        expect(renderParsed(settings)).toStrictEqual(expected);
      },
    );
  });

  it("renders the text process-environment.sh wrote, line by line", () => {
    expect(
      renderDefaultConnection({
        GRAPH_CONNECTION_URL: db,
        GRAPH_TYPE: "gremlin",
        IAM: "true",
        AWS_REGION: "us-east-1",
      }),
    ).toBe(
      [
        "",
        "{",
        '"GRAPH_EXP_CONNECTION_URL":"https://db:8182",',
        '"GRAPH_EXP_GRAPH_TYPE":"gremlin",',
        '"GRAPH_EXP_SERVICE_TYPE":"neptune-db",',
        '"GRAPH_EXP_IAM":true,',
        '"GRAPH_EXP_AWS_REGION":"us-east-1",',
        '"GRAPH_EXP_USING_PROXY_SERVER":true',
        "}",
        "",
      ].join("\n"),
    );
  });

  // Earlier versions wrote the IAM value as it was given, so a value that
  // isn't a JSON literal made a file the browser couldn't read.
  it("writes an IAM of True as it is", () => {
    expect(
      renderDefaultConnection({ GRAPH_CONNECTION_URL: db, IAM: "True" }),
    ).toContain('"GRAPH_EXP_IAM":True,\n');
  });

  // Earlier versions wrote the legacy names to defaultConnection.json for no
  // reason. The browser reads only the GRAPH_EXP_ names.
  it("never includes the legacy variable names", () => {
    expect(
      renderParsed({
        USING_PROXY_SERVER: "true",
        GRAPH_CONNECTION_URL: "https://proxied:8182",
        PUBLIC_OR_PROXY_ENDPOINT: "https://public:9250",
      }),
    ).not.toHaveProperty("GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT");
  });

  it("treats an empty setting as unset", () => {
    expect(
      renderParsed({
        GRAPH_CONNECTION_URL: db,
        GRAPH_TYPE: "",
        SERVICE_TYPE: "",
        IAM: "",
      }),
    ).toStrictEqual({
      GRAPH_EXP_CONNECTION_URL: db,
      GRAPH_EXP_SERVICE_TYPE: "neptune-db",
      GRAPH_EXP_IAM: false,
      GRAPH_EXP_AWS_REGION: "",
      GRAPH_EXP_USING_PROXY_SERVER: true,
    });
  });
});
