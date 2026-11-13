import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import {
  type ConfigJson,
  ConfigJsonError,
  parseConfigJson,
  readConfigJson,
} from "./config-json.ts";

const filePath = "/graph-explorer/config.json";

type Fixture = {
  name: string;
  text: string;
  values: ConfigJson["values"];
};

/** Texts of a config.json, with the settings the parser reads from them. */
const fixtures: Fixture[] = [
  {
    name: "the example in the configuration docs",
    text: `{
  "GRAPH_CONNECTION_URL": "https://my-cluster.us-west-2.neptune.amazonaws.com:8182",
  "IAM": true,
  "SERVICE_TYPE": "neptune-db",
  "AWS_REGION": "us-west-2",
  "GRAPH_TYPE": "gremlin",
  "PROXY_SERVER_HTTPS_CONNECTION": true,
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 240000,
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500
}`,
    values: {
      GRAPH_CONNECTION_URL:
        "https://my-cluster.us-west-2.neptune.amazonaws.com:8182",
      IAM: "true",
      SERVICE_TYPE: "neptune-db",
      AWS_REGION: "us-west-2",
      GRAPH_TYPE: "gremlin",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "240000",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "500",
    },
  },
  {
    name: "every shell setting as JSON.stringify writes it",
    text: JSON.stringify({
      PUBLIC_OR_PROXY_ENDPOINT: "https://public:8182",
      GRAPH_TYPE: "sparql",
      SERVICE_TYPE: "neptune-graph",
      USING_PROXY_SERVER: false,
      IAM: false,
      GRAPH_CONNECTION_URL: "https://db:8182",
      AWS_REGION: "eu-west-1",
      PROXY_SERVER_HTTPS_CONNECTION: false,
      GRAPH_EXP_HTTPS_CONNECTION: false,
      NEPTUNE_NOTEBOOK: true,
    }),
    values: {
      PUBLIC_OR_PROXY_ENDPOINT: "https://public:8182",
      GRAPH_TYPE: "sparql",
      SERVICE_TYPE: "neptune-graph",
      USING_PROXY_SERVER: "false",
      IAM: "false",
      GRAPH_CONNECTION_URL: "https://db:8182",
      AWS_REGION: "eu-west-1",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      GRAPH_EXP_HTTPS_CONNECTION: "false",
      NEPTUNE_NOTEBOOK: "true",
    },
  },
  {
    name: "a null scalar and a numeric scalar",
    text: '{"IAM": null, "USING_PROXY_SERVER": 0}',
    values: { IAM: "null", USING_PROXY_SERVER: "0" },
  },
  {
    name: "scalars written as strings",
    text: '{"PROXY_SERVER_HTTPS_CONNECTION": "True", "NEPTUNE_NOTEBOOK": "TRUE", "IAM": " true "}',
    values: {
      PROXY_SERVER_HTTPS_CONNECTION: "True",
      NEPTUNE_NOTEBOOK: "TRUE",
      IAM: "true",
    },
  },
  {
    name: "text settings that are null, numbers, or booleans",
    text: '{"GRAPH_TYPE": null, "AWS_REGION": 5, "SERVICE_TYPE": true}',
    values: {},
  },
  {
    name: "// comments that hold no setting",
    text: `{
  // Connection to my cluster
  "GRAPH_CONNECTION_URL": "https://db:8182", // the proxied endpoint
  "IAM": true
}`,
    values: { GRAPH_CONNECTION_URL: "https://db:8182", IAM: "true" },
  },
  {
    name: "a block comment that holds no setting",
    text: `{
  /* Connection
     to my cluster */
  "GRAPH_CONNECTION_URL": "https://db:8182"
}`,
    values: { GRAPH_CONNECTION_URL: "https://db:8182" },
  },
  {
    name: "trailing commas",
    text: `{
  "GRAPH_TYPE": "gremlin",
  "IAM": true,
}`,
    values: { GRAPH_TYPE: "gremlin", IAM: "true" },
  },
  {
    name: "CRLF line endings",
    text: '{\r\n  "GRAPH_CONNECTION_URL": "https://db:8182",\r\n  "AWS_REGION": "us-west-2",\r\n  "IAM": true\r\n}\r\n',
    values: {
      GRAPH_CONNECTION_URL: "https://db:8182",
      AWS_REGION: "us-west-2",
      IAM: "true",
    },
  },
  {
    name: "a UTF-8 byte-order mark",
    text: '\uFEFF{"GRAPH_TYPE": "gremlin", "IAM": true}',
    values: { GRAPH_TYPE: "gremlin", IAM: "true" },
  },
  {
    name: "spaces after the colon",
    text: '{"GRAPH_TYPE":    "sparql", "IAM":   true}',
    values: { GRAPH_TYPE: "sparql", IAM: "true" },
  },
  {
    name: "a URL whose slashes look like a comment",
    text: '{"GRAPH_CONNECTION_URL": "https://db:8182//path"}',
    values: { GRAPH_CONNECTION_URL: "https://db:8182//path" },
  },
  {
    name: "the two settings the shell never read, as numbers",
    text: '{"GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 60000, "GRAPH_EXP_NODE_EXPANSION_LIMIT": 100}',
    values: {
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "60000",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "100",
    },
  },
  {
    name: "the two settings the shell never read, as strings of digits",
    text: '{"GRAPH_EXP_FETCH_REQUEST_TIMEOUT": "60000", "GRAPH_EXP_NODE_EXPANSION_LIMIT": "100"}',
    values: {
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "60000",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "100",
    },
  },
  {
    name: "numbers that aren't positive whole numbers, as the text the Default Connection checks",
    text: '{"GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 0, "GRAPH_EXP_NODE_EXPANSION_LIMIT": -1}',
    values: {
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "0",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "-1",
    },
  },
  {
    name: "a fraction and words for the two numeric settings",
    text: '{"GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 1.5, "GRAPH_EXP_NODE_EXPANSION_LIMIT": "many"}',
    values: {
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: "1.5",
      GRAPH_EXP_NODE_EXPANSION_LIMIT: "many",
    },
  },
  {
    name: "an empty object",
    text: "{}",
    values: {},
  },
  {
    name: "an empty string for a text setting",
    text: '{"GRAPH_TYPE": ""}',
    values: {},
  },
];

describe("parseConfigJson", () => {
  /**
   * BACKWARD COMPATIBILITY: config.json FILES EARLIER VERSIONS READ
   *
   * Through v3.3.0, process-environment.sh read config.json by searching its
   * text for each setting, so a file with comments, trailing commas, CRLF line
   * endings, a byte-order mark, or flags written as strings, numbers, or null
   * still started the container. Each fixture is a file of one such shape,
   * with the settings that script took from it.
   *
   * Do not delete or weaken these without confirming that no deployment
   * mounts a config.json of these shapes while upgrades from 3.3.0 or earlier
   * are supported.
   */
  describe("backward compatibility: config.json files earlier versions read", () => {
    it.for(fixtures.map(fixture => [fixture.name, fixture] as const))(
      "reads %s",
      ([_name, { text, values }]) => {
        expect(parseConfigJson(text, filePath)).toStrictEqual({
          values,
          warnings: [],
        });
      },
    );
  });

  it.for([
    ["a boolean", "true"],
    ["a string", '"a"'],
    ["null", "null"],
    ["an array", '[{"IAM": true}]'],
  ])("throws for JSON that is %s", ([_kind, text]) => {
    expect(() => parseConfigJson(text, filePath)).toThrow(
      new ConfigJsonError(`${filePath} must hold a JSON object of settings.`),
    );
  });

  it("ignores settings it doesn't know", () => {
    expect(
      parseConfigJson('{"SOMETHING_ELSE": "x", "IAM": true}', filePath).values,
    ).toStrictEqual({ IAM: "true" });
  });

  it.for([
    ["an object", '{"IAM": {"enabled": true}}', "IAM", '{"enabled":true}'],
    ["an array", '{"GRAPH_TYPE": ["gremlin"]}', "GRAPH_TYPE", '["gremlin"]'],
  ])(
    "ignores %s with a warning naming the setting",
    ([_kind, text, key, shown]) => {
      const { values, warnings } = parseConfigJson(text, filePath);

      expect(values).toStrictEqual({});
      expect(warnings).toStrictEqual([
        `${filePath}: ${key} can't be ${shown}, so it is ignored.`,
      ]);
    },
  );

  describe("a setting set more than once", () => {
    it("throws naming the file, the setting, and its lines", () => {
      expect(() =>
        parseConfigJson(
          `{
  "PROXY_SERVER_HTTPS_CONNECTION": false,
  "GRAPH_TYPE": "gremlin",
  "PROXY_SERVER_HTTPS_CONNECTION": true
}`,
          filePath,
        ),
      ).toThrow(
        new ConfigJsonError(
          `${filePath} sets PROXY_SERVER_HTTPS_CONNECTION more than once, on lines 2 and 4. Keep one entry for each setting and remove the others.`,
        ),
      );
    });

    it("names every setting set more than once", () => {
      expect(() =>
        parseConfigJson(
          '{"IAM": true,\n"GRAPH_TYPE": "gremlin",\n"IAM": false,\n"GRAPH_TYPE": "sparql",\n"IAM": true}',
          filePath,
        ),
      ).toThrow(
        new ConfigJsonError(
          `${filePath} sets GRAPH_TYPE more than once, on lines 2 and 4. ${filePath} sets IAM more than once, on lines 1, 3, and 5. Keep one entry for each setting and remove the others.`,
        ),
      );
    });

    it("counts a key of a nested object apart from the top-level settings", () => {
      expect(
        parseConfigJson('{"IAM": true, "other": {"IAM": false}}', filePath)
          .values,
      ).toStrictEqual({ IAM: "true" });
    });

    it("counts a setting that only a comment repeats once", () => {
      expect(
        parseConfigJson(
          `{
  // "IAM": false,
  "IAM": true
}`,
          filePath,
        ).values,
      ).toStrictEqual({ IAM: "true" });
    });
  });

  // #1670: the shell searched the text for each setting, so a setting that
  // only a comment holds took effect. Nothing in a comment is a setting.
  describe("a setting in a comment", () => {
    it.for([
      [
        "a // comment",
        `{
  // "PROXY_SERVER_HTTPS_CONNECTION": false,
  "GRAPH_TYPE": "gremlin"
}`,
      ],
      [
        "a block comment",
        `{
  /* "PROXY_SERVER_HTTPS_CONNECTION": false, */
  "GRAPH_TYPE": "gremlin"
}`,
      ],
    ])("in %s is unset", ([_kind, text]) => {
      expect(parseConfigJson(text, filePath)).toStrictEqual({
        values: { GRAPH_TYPE: "gremlin" },
        warnings: [],
      });
    });

    it("loses to the same setting outside a comment", () => {
      expect(
        parseConfigJson(
          `{
  // "IAM": false,
  "IAM": true
}`,
          filePath,
        ).values,
      ).toStrictEqual({ IAM: "true" });
    });
  });

  describe("text that isn't JSON", () => {
    it.for([
      ["text", 'this is not JSON\n"IAM": true\n'],
      ["an unterminated object", '{"GRAPH_TYPE": "gremlin", "IAM": true'],
      ["an unquoted key", "{GRAPH_TYPE: 'gremlin'}"],
    ])("throws for %s, naming the file", ([_kind, text]) => {
      expect(() => parseConfigJson(text, filePath)).toThrow(ConfigJsonError);
      expect(() => parseConfigJson(text, filePath)).toThrow(
        `${filePath} isn't valid JSON, so Graph Explorer can't read its settings`,
      );
    });

    it.for([
      ["an empty file", ""],
      ["a file of whitespace", " \n\t\n"],
      ["a file of only a byte-order mark", "\uFEFF"],
      ["a file of only line comments", '// {\n//   "IAM": true\n// }\n'],
      ["a file of only a block comment", '/* {\n  "IAM": true\n} */'],
    ])("throws for %s, saying it is empty", ([_kind, text]) => {
      const error = new ConfigJsonError(
        `${filePath} is empty or holds only comments. Add settings to it, or remove the file to start without them.`,
      );

      expect(() => parseConfigJson(text, filePath)).toThrow(error);
    });

    it("reports a syntax error at its line in a file with comments", () => {
      const text = `{
  /* Connection
     to my cluster */
  "GRAPH_TYPE": "gremlin", // the language
  "IAM": true
  "AWS_REGION": "us-west-2"
}`;

      expect(() => parseConfigJson(text, filePath)).toThrow(/line 6 /);
    });

    it("doesn't take a comma out of a string", () => {
      expect(
        parseConfigJson('{"GRAPH_TYPE": "a,}"}', filePath).values,
      ).toStrictEqual({ GRAPH_TYPE: "a,}" });
    });
  });
});

describe("readConfigJson", () => {
  let folder: string;

  beforeAll(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "ge-config-json-"));
  });

  afterAll(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it("returns undefined for a missing file", () => {
    expect(readConfigJson(path.join(folder, "missing.json"))).toBeUndefined();
  });

  it("returns undefined for a directory, as Docker creates at a missing bind source", () => {
    const directory = path.join(folder, "config.json");
    fs.mkdirSync(directory);

    expect(readConfigJson(directory)).toBeUndefined();
  });

  it("throws for a file that isn't JSON", () => {
    const file = path.join(folder, "broken-config.json");
    fs.writeFileSync(file, "not json");

    expect(() => readConfigJson(file)).toThrow(ConfigJsonError);
  });

  it("parses a file", () => {
    const file = path.join(folder, "real-config.json");
    fs.writeFileSync(file, '{"IAM": true, // sign requests\n}');

    expect(readConfigJson(file)).toStrictEqual({
      values: { IAM: "true" },
      warnings: [],
    });
  });
});
