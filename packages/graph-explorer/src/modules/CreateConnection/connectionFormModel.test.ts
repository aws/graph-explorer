import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import {
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_NODE_EXPAND_LIMIT,
} from "@/utils/constants";
import { createRandomRawConfiguration } from "@/utils/testing";

import {
  type ConnectionFormValues,
  createEmptyConnectionForm,
  hasAdvancedOverrides,
  mapConfigurationToConnectionForm,
  mapToConnection,
  mapToConnectionForm,
  queryEngineSchema,
  serviceTypeSchema,
  updateConnectionForm,
  validateConnectionForm,
} from "./connectionFormModel";

function createValidForm(
  overrides: Partial<ConnectionFormValues> = {},
): ConnectionFormValues {
  return {
    ...mapToConnectionForm(createRandomName("Connection"), {
      graphDbUrl: createRandomUrlString(),
    }),
    ...overrides,
  };
}

describe("createEmptyConnectionForm", () => {
  test("names the connection after the current time", () => {
    const form = createEmptyConnectionForm(new Date("2026-09-29T13:45:00Z"));

    expect(form).toStrictEqual({
      name: "Connection (2026-09-29 13:45)",
      graphDbUrl: "",
      queryEngine: "gremlin",
      directConnection: false,
      awsAuthEnabled: false,
      serviceType: "neptune-db",
      awsRegion: "",
      fetchTimeoutEnabled: false,
      fetchTimeoutMs: undefined,
      nodeExpansionLimitEnabled: false,
      nodeExpansionLimit: undefined,
    });
  });
});

describe("mapToConnectionForm", () => {
  test("maps a connection's IAM auth into form values", () => {
    const name = createRandomName("Connection");
    const graphDbUrl = createRandomUrlString();

    const form = mapToConnectionForm(name, {
      queryEngine: "openCypher",
      graphDbUrl,
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });

    expect(form).toStrictEqual({
      name,
      graphDbUrl,
      queryEngine: "openCypher",
      directConnection: false,
      awsAuthEnabled: true,
      serviceType: "neptune-graph",
      awsRegion: "us-west-2",
      fetchTimeoutEnabled: false,
      fetchTimeoutMs: undefined,
      nodeExpansionLimitEnabled: false,
      nodeExpansionLimit: undefined,
    });
  });

  test("maps a direct connection to the direct option", () => {
    const name = createRandomName("Connection");
    const graphDbUrl = createRandomUrlString();

    const form = mapToConnectionForm(name, {
      graphDbUrl,
      proxyConnection: false,
    });

    expect(form).toStrictEqual({
      ...mapToConnectionForm(name, { graphDbUrl }),
      directConnection: true,
    });
  });

  test("maps a connection without a query language or routing flag to a Gremlin proxy connection", () => {
    const name = createRandomName("Connection");
    const graphDbUrl = createRandomUrlString();

    expect(mapToConnectionForm(name, { graphDbUrl })).toStrictEqual({
      name,
      graphDbUrl,
      queryEngine: "gremlin",
      directConnection: false,
      awsAuthEnabled: false,
      serviceType: "neptune-db",
      awsRegion: "",
      fetchTimeoutEnabled: false,
      fetchTimeoutMs: undefined,
      nodeExpansionLimitEnabled: false,
      nodeExpansionLimit: undefined,
    });
  });

  test("enables the overrides a connection sets", () => {
    const name = createRandomName("Connection");
    const graphDbUrl = createRandomUrlString();

    const form = mapToConnectionForm(name, {
      graphDbUrl,
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 50,
    });

    expect(form).toStrictEqual({
      ...mapToConnectionForm(name, { graphDbUrl }),
      fetchTimeoutEnabled: true,
      fetchTimeoutMs: 30000,
      nodeExpansionLimitEnabled: true,
      nodeExpansionLimit: 50,
    });
  });
});

describe("mapConfigurationToConnectionForm", () => {
  test("names a labeled connection by its label", () => {
    const displayLabel = createRandomName("Label");
    const config = { ...createRandomRawConfiguration(), displayLabel };

    expect(mapConfigurationToConnectionForm(config)).toStrictEqual(
      mapToConnectionForm(displayLabel, config.connection),
    );
  });

  // The rest of the app shows an unlabeled connection by its id, so the form
  // should too rather than presenting it as nameless.
  test("names an unlabeled connection by its id", () => {
    const config = {
      ...createRandomRawConfiguration(),
      displayLabel: undefined,
    };

    expect(mapConfigurationToConnectionForm(config)).toStrictEqual(
      mapToConnectionForm(config.id, config.connection),
    );
  });
});

describe("mapToConnection", () => {
  test("keeps IAM settings on a proxy connection", () => {
    const form = createValidForm({
      queryEngine: "openCypher",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-graph",
    });

    expect(mapToConnection(form)).toStrictEqual({
      graphDbUrl: form.graphDbUrl,
      queryEngine: "openCypher",
      awsAuthEnabled: true,
      serviceType: "neptune-graph",
      awsRegion: "us-east-1",
      fetchTimeoutMs: undefined,
      nodeExpansionLimit: undefined,
    });
  });

  test("drops IAM settings from a direct connection", () => {
    const form = createValidForm({
      directConnection: true,
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
    });

    expect(mapToConnection(form)).toStrictEqual({
      graphDbUrl: form.graphDbUrl,
      queryEngine: "gremlin",
      proxyConnection: false,
      fetchTimeoutMs: undefined,
      nodeExpansionLimit: undefined,
    });
  });

  test("omits an override value whose option is disabled", () => {
    const form = createValidForm({
      fetchTimeoutEnabled: false,
      fetchTimeoutMs: 30000,
      nodeExpansionLimitEnabled: false,
      nodeExpansionLimit: 50,
    });

    expect(mapToConnection(form)).toStrictEqual({
      graphDbUrl: form.graphDbUrl,
      queryEngine: "gremlin",
      awsAuthEnabled: false,
      serviceType: "neptune-db",
      awsRegion: "",
      fetchTimeoutMs: undefined,
      nodeExpansionLimit: undefined,
    });
  });

  test("keeps an override value whose option is enabled", () => {
    const form = createValidForm({
      fetchTimeoutEnabled: true,
      fetchTimeoutMs: 30000,
      nodeExpansionLimitEnabled: true,
      nodeExpansionLimit: 50,
    });

    expect(mapToConnection(form)).toStrictEqual({
      graphDbUrl: form.graphDbUrl,
      queryEngine: "gremlin",
      awsAuthEnabled: false,
      serviceType: "neptune-db",
      awsRegion: "",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 50,
    });
  });
});

describe("validateConnectionForm", () => {
  test("accepts a complete form", () => {
    const form = createValidForm();

    expect(validateConnectionForm(form)).toStrictEqual({
      valid: true,
      values: form,
    });
  });

  test("removes newlines and surrounding whitespace from the database URL", () => {
    const form = createValidForm({
      graphDbUrl: "  https://database.example.com/\ngraph  ",
    });

    expect(validateConnectionForm(form)).toStrictEqual({
      valid: true,
      values: { ...form, graphDbUrl: "https://database.example.com/graph" },
    });
  });

  test("requires a name", () => {
    const validation = validateConnectionForm(createValidForm({ name: "" }));

    expect(validation).toStrictEqual({
      valid: false,
      errors: { name: "Name is required" },
    });
  });

  test("requires a URL that is not empty after normalization", () => {
    const validation = validateConnectionForm(
      createValidForm({ graphDbUrl: "  \n  " }),
    );

    expect(validation).toStrictEqual({
      valid: false,
      errors: { graphDbUrl: "URL is required" },
    });
  });

  test("accepts a proxy connection whose URL has no protocol", () => {
    const form = createValidForm({ graphDbUrl: "localhost:8182" });

    expect(validateConnectionForm(form)).toStrictEqual({
      valid: true,
      values: form,
    });
  });

  test.each(["localhost:8182", "/neptune", "ftp://database.example.com"])(
    "rejects the non-absolute http(s) URL %s for a direct connection",
    graphDbUrl => {
      const validation = validateConnectionForm(
        createValidForm({ graphDbUrl, directConnection: true }),
      );

      expect(validation).toStrictEqual({
        valid: false,
        errors: {
          graphDbUrl:
            "A direct connection needs a full URL starting with http:// or https://",
        },
      });
    },
  );

  test("requires a region when IAM auth is enabled", () => {
    const validation = validateConnectionForm(
      createValidForm({ awsAuthEnabled: true, awsRegion: "" }),
    );

    expect(validation).toStrictEqual({
      valid: false,
      errors: { awsRegion: "Region is required" },
    });
  });

  // The IAM controls are hidden for a direct connection, and it is never signed.
  test("ignores a missing region on a direct connection", () => {
    const form = createValidForm({
      directConnection: true,
      awsAuthEnabled: true,
      awsRegion: "",
    });

    expect(validateConnectionForm(form)).toStrictEqual({
      valid: true,
      values: form,
    });
  });

  test("reports every invalid field at once", () => {
    const validation = validateConnectionForm(
      createValidForm({
        name: "",
        graphDbUrl: "",
        awsAuthEnabled: true,
        awsRegion: "",
      }),
    );

    expect(validation).toStrictEqual({
      valid: false,
      errors: {
        name: "Name is required",
        graphDbUrl: "URL is required",
        awsRegion: "Region is required",
      },
    });
  });
});

describe("updateConnectionForm", () => {
  test("sets the changed field", () => {
    const form = createValidForm();

    expect(updateConnectionForm(form, "awsRegion", "eu-west-1")).toStrictEqual({
      ...form,
      awsRegion: "eu-west-1",
    });
  });

  // Neptune Analytics only runs openCypher.
  test("switches to openCypher when Neptune Analytics is chosen", () => {
    const form = createValidForm({ queryEngine: "sparql" });

    expect(
      updateConnectionForm(form, "serviceType", "neptune-graph"),
    ).toStrictEqual({
      ...form,
      serviceType: "neptune-graph",
      queryEngine: "openCypher",
    });
  });

  test("keeps the query language when Neptune DB is chosen", () => {
    const form = createValidForm({
      queryEngine: "sparql",
      serviceType: "neptune-graph",
    });

    expect(
      updateConnectionForm(form, "serviceType", "neptune-db"),
    ).toStrictEqual({ ...form, serviceType: "neptune-db" });
  });

  test("fills in the default fetch timeout when it is enabled", () => {
    const form = createValidForm();

    expect(
      updateConnectionForm(form, "fetchTimeoutEnabled", true),
    ).toStrictEqual({
      ...form,
      fetchTimeoutEnabled: true,
      fetchTimeoutMs: DEFAULT_FETCH_TIMEOUT,
    });
  });

  test("clears the fetch timeout when it is disabled", () => {
    const form = createValidForm({
      fetchTimeoutEnabled: true,
      fetchTimeoutMs: 30000,
    });

    expect(
      updateConnectionForm(form, "fetchTimeoutEnabled", false),
    ).toStrictEqual({
      ...form,
      fetchTimeoutEnabled: false,
      fetchTimeoutMs: undefined,
    });
  });

  test("fills in the default neighbor expansion limit when it is enabled", () => {
    const form = createValidForm();

    expect(
      updateConnectionForm(form, "nodeExpansionLimitEnabled", true),
    ).toStrictEqual({
      ...form,
      nodeExpansionLimitEnabled: true,
      nodeExpansionLimit: DEFAULT_NODE_EXPAND_LIMIT,
    });
  });

  test("clears the neighbor expansion limit when it is disabled", () => {
    const form = createValidForm({
      nodeExpansionLimitEnabled: true,
      nodeExpansionLimit: 50,
    });

    expect(
      updateConnectionForm(form, "nodeExpansionLimitEnabled", false),
    ).toStrictEqual({
      ...form,
      nodeExpansionLimitEnabled: false,
      nodeExpansionLimit: undefined,
    });
  });
});

describe("hasAdvancedOverrides", () => {
  test("is false for the defaults", () => {
    expect(hasAdvancedOverrides(createValidForm())).toBe(false);
  });

  test.each([
    { fetchTimeoutEnabled: true },
    { nodeExpansionLimitEnabled: true },
    { directConnection: true },
  ])("is true when %o", override => {
    expect(hasAdvancedOverrides(createValidForm(override))).toBe(true);
  });
});

describe("queryEngineSchema", () => {
  test("parses a known query language", () => {
    expect(queryEngineSchema.parse("sparql")).toBe("sparql");
  });

  test("rejects an unknown query language", () => {
    expect(queryEngineSchema.safeParse("sql").success).toBe(false);
  });
});

describe("serviceTypeSchema", () => {
  test("parses a known service type", () => {
    expect(serviceTypeSchema.parse("neptune-graph")).toBe("neptune-graph");
  });

  test("rejects an unknown service type", () => {
    expect(serviceTypeSchema.safeParse("neptune-serverless").success).toBe(
      false,
    );
  });
});
