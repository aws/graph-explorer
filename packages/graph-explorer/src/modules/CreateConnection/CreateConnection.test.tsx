// @vitest-environment happy-dom

import type { ConnectionConfig } from "@shared/types";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { createNewConfigurationId, type RawConfiguration } from "@/connections";
import {
  allGraphSessionsAtom,
  type ConfigurationContextProps,
  configurationAtom,
  getAppStore,
  schemaAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  mergeConfiguration,
  transformLegacyConnection,
} from "@/core/StateProvider/configuration";
import {
  createRandomEdgeId,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexId,
  TestProvider,
} from "@/utils/testing";

import CreateConnection, { mapToConnectionForm } from "./CreateConnection";

function renderCreateConnection(ui: React.ReactElement) {
  const store = getAppStore();
  store.set(configurationAtom, new Map());

  render(ui, {
    wrapper: ({ children }) => (
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </TestProvider>
    ),
  });

  return store;
}

/** The advanced settings are behind a disclosure, so their content is unmounted until it opens. */
async function openAdvancedOptions(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Advanced options" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
}

describe("CreateConnection", () => {
  test("does not render the removed proxy server controls", () => {
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    // Proves the queries below fail on absence rather than a wrong name
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", { name: "Public or Proxy Endpoint" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Using Proxy-Server" }),
    ).toBeNull();
  });

  test("suggests a database URL that includes the port", () => {
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    // Copying a placeholder without the port produces a connection that
    // fails against the default HTTPS port
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toHaveAttribute(
      "placeholder",
      "https://neptune-cluster.amazonaws.com:8182",
    );
  });

  test("offers AWS IAM auth without requiring a proxy server first", () => {
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    expect(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    ).toBeInTheDocument();
  });

  test("removes newlines and surrounding whitespace from the database URL", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "My Connection",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "  https://database.example.com/{Enter}graph  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection).toMatchObject({
      connection: {
        graphDbUrl: "https://database.example.com/graph",
      },
    });
    expect(savedConnection.connection).not.toHaveProperty("url");
    expect(savedConnection.connection).not.toHaveProperty("proxyConnection");
  });

  describe("deprecated direct connection", () => {
    const directOption = {
      name: /Connect directly from the browser \(deprecated\)/,
    };

    test("hides the IAM controls when connecting directly", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      await user.click(
        screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      );
      await openAdvancedOptions(user);
      await user.click(screen.getByRole("checkbox", directOption));

      expect(
        screen.queryByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      ).toBeNull();
      expect(screen.queryByRole("textbox", { name: "AWS Region" })).toBeNull();
    });

    test("saves a direct connection without IAM settings", async () => {
      const user = userEvent.setup();
      const store = renderCreateConnection(
        <CreateConnection onClose={vi.fn()} />,
      );

      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "My Connection",
      );
      await user.type(
        screen.getByRole("textbox", { name: "Database URL" }),
        "https://database.example.com:8182",
      );
      // IAM set up before switching to direct must not be saved, since the
      // region it requires is hidden and a direct request is never signed.
      await user.click(
        screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      );
      await openAdvancedOptions(user);
      await user.click(screen.getByRole("checkbox", directOption));
      await user.click(screen.getByRole("button", { name: "Add Connection" }));

      await waitFor(() => {
        expect(store.get(configurationAtom)).toHaveLength(1);
      });

      const [savedConnection] = store.get(configurationAtom).values();
      expect(savedConnection.connection).toStrictEqual({
        graphDbUrl: "https://database.example.com:8182",
        proxyConnection: false,
        queryEngine: "gremlin",
        fetchTimeoutMs: undefined,
        nodeExpansionLimit: undefined,
      });
    });

    test.each(["localhost:8182", "/neptune", "ftp://database.example.com"])(
      "rejects the non-absolute http(s) URL %s for a direct connection",
      async graphDbUrl => {
        const user = userEvent.setup();
        const store = renderCreateConnection(
          <CreateConnection onClose={vi.fn()} />,
        );

        await user.type(
          screen.getByRole("textbox", { name: "Name" }),
          "My Connection",
        );
        await user.type(
          screen.getByRole("textbox", { name: "Database URL" }),
          graphDbUrl,
        );
        await openAdvancedOptions(user);
        await user.click(screen.getByRole("checkbox", directOption));
        await user.click(
          screen.getByRole("button", { name: "Add Connection" }),
        );

        expect(store.get(configurationAtom)).toHaveLength(0);
        expect(
          screen.getByText(
            "A direct connection needs a full URL starting with http:// or https://",
          ),
        ).toBeInTheDocument();
      },
    );

    test("saves a proxy connection whose URL has no protocol", async () => {
      const user = userEvent.setup();
      const store = renderCreateConnection(
        <CreateConnection onClose={vi.fn()} />,
      );

      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "My Connection",
      );
      await user.type(
        screen.getByRole("textbox", { name: "Database URL" }),
        "localhost:8182",
      );
      await user.click(screen.getByRole("button", { name: "Add Connection" }));

      await waitFor(() => {
        expect(store.get(configurationAtom)).toHaveLength(1);
      });
    });

    test("shows an existing direct connection as direct", () => {
      const config = {
        ...createRandomRawConfiguration(),
        connection: {
          graphDbUrl: "https://database.example.com:8182",
          proxyConnection: false,
        },
      };

      renderCreateConnection(
        <CreateConnection
          existingConfig={{
            ...mergeConfiguration(null, config, new Map(), new Map()),
            totalVertices: 0,
            vertexTypes: [],
            totalEdges: 0,
            edgeTypes: [],
          }}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByRole("checkbox", directOption)).toBeChecked();
    });

    test("leaves the option unchecked for an existing proxy connection", async () => {
      const user = userEvent.setup();
      const config = {
        ...createRandomRawConfiguration(),
        connection: { graphDbUrl: "https://database.example.com:8182" },
      };
      const store = renderCreateConnection(
        <CreateConnection
          existingConfig={{
            ...mergeConfiguration(null, config, new Map(), new Map()),
            totalVertices: 0,
            vertexTypes: [],
            totalEdges: 0,
            edgeTypes: [],
          }}
          onClose={vi.fn()}
        />,
      );
      store.set(configurationAtom, new Map([[config.id, config]]));

      await openAdvancedOptions(user);
      expect(screen.getByRole("checkbox", directOption)).not.toBeChecked();

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      const savedConnection = store.get(configurationAtom).get(config.id);
      expect(savedConnection?.connection).toMatchObject({
        graphDbUrl: "https://database.example.com:8182",
      });
      expect(savedConnection?.connection).not.toHaveProperty("proxyConnection");
    });

    test("saves an existing direct connection back to a proxy connection when unchecked", async () => {
      const user = userEvent.setup();
      const config = {
        ...createRandomRawConfiguration(),
        connection: {
          graphDbUrl: "https://database.example.com:8182",
          proxyConnection: false,
        },
      };
      const store = renderCreateConnection(
        <CreateConnection
          existingConfig={{
            ...mergeConfiguration(null, config, new Map(), new Map()),
            totalVertices: 0,
            vertexTypes: [],
            totalEdges: 0,
            edgeTypes: [],
          }}
          onClose={vi.fn()}
        />,
      );
      store.set(configurationAtom, new Map([[config.id, config]]));

      expect(
        screen.getByRole("button", { name: "Advanced options" }),
      ).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("checkbox", directOption)).toBeChecked();

      await user.click(screen.getByRole("checkbox", directOption));

      expect(
        screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      const savedConnection = store.get(configurationAtom).get(config.id);
      expect(savedConnection?.connection).not.toHaveProperty("proxyConnection");
    });
  });

  /**
   * BACKWARD COMPATIBILITY: EDITING A CONNECTION STORED BY AN EARLIER VERSION
   *
   * An earlier version stored a proxied connection with `url` holding the
   * proxy and `graphDbUrl` the database. The edit dialog sees it after the
   * read transform, so saving it unchanged must not look like a new database
   * and throw away its schema and graph session.
   */
  describe("saving a proxied connection stored by an earlier version", () => {
    function renderUpgradedConnection() {
      const config: RawConfiguration = {
        ...createRandomRawConfiguration(),
        connection: transformLegacyConnection({
          url: "https://proxy.example.com",
          proxyConnection: true,
          graphDbUrl: "https://database.example.com:8182",
          queryEngine: "gremlin",
        }),
      };
      const store = renderCreateConnection(
        <CreateConnection
          existingConfig={{
            ...mergeConfiguration(null, config, new Map(), new Map()),
            totalVertices: 0,
            vertexTypes: [],
            totalEdges: 0,
            edgeTypes: [],
          }}
          onClose={vi.fn()}
        />,
      );
      const schema = createRandomSchema();
      const session = {
        vertices: new Set([createRandomVertexId()]),
        edges: new Set([createRandomEdgeId()]),
      };
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(allGraphSessionsAtom, new Map([[config.id, session]]));
      return { store, config, schema, session };
    }

    test("keeps the schema and graph session when saved unchanged", async () => {
      const user = userEvent.setup();
      const { store, config, schema, session } = renderUpgradedConnection();

      // The dialog must show the database URL, not the legacy proxy url that
      // the stored shape also carried.
      expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
        "https://database.example.com:8182",
      );

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      expect(store.get(schemaAtom).get(config.id)).toBe(schema);
      expect(store.get(allGraphSessionsAtom).get(config.id)).toBe(session);
    });

    test("clears the schema and graph session when the Database URL changes", async () => {
      const user = userEvent.setup();
      const { store, config } = renderUpgradedConnection();

      const databaseUrl = screen.getByRole("textbox", { name: "Database URL" });
      await user.clear(databaseUrl);
      await user.type(databaseUrl, "https://other-database.example.com:8182");
      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      expect(store.get(schemaAtom).has(config.id)).toBe(false);
      expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(false);
    });
  });

  test("labels the override field Neighbor Expansion Limit", async () => {
    const user = userEvent.setup();
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);
    await openAdvancedOptions(user);

    await user.click(
      screen.getByRole("checkbox", {
        name: /Override Default Neighbor Expansion Limit/,
      }),
    );

    expect(
      screen.getByRole("spinbutton", { name: "Neighbor Expansion Limit" }),
    ).toBeInTheDocument();
  });

  test("keeps the advanced options collapsed until the user expands them", async () => {
    const user = userEvent.setup();
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    expect(
      screen.queryByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).not.toBeInTheDocument();

    await openAdvancedOptions(user);

    expect(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Override Default Neighbor Expansion Limit/,
      }),
    ).toBeInTheDocument();
  });

  test("opens the advanced options when the connection already overrides one", () => {
    const configId = createNewConfigurationId();
    const store = getAppStore();
    const connection: ConnectionConfig = {
      graphDbUrl: "https://db.example.com",
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
    };
    store.set(
      configurationAtom,
      new Map([[configId, { id: configId, connection }]]),
    );

    render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <CreateConnection
            existingConfig={
              { id: configId, connection } as ConfigurationContextProps
            }
            onClose={vi.fn()}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Advanced options" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).toBeChecked();
  });

  test("rejects a URL that is empty after normalization", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "My Connection",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "  {Enter}  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    expect(store.get(configurationAtom)).toHaveLength(0);
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });

  test("prefills the form from initialValues without entering edit mode", () => {
    renderCreateConnection(
      <CreateConnection
        initialValues={{
          name: "Seeded Graph",
          graphDbUrl: "https://seed.neptune.amazonaws.com",
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Seeded Graph");
    expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
      "https://seed.neptune.amazonaws.com",
    );
    // Still in "add" mode, not "update"
    expect(
      screen.getByRole("button", { name: "Add Connection" }),
    ).toBeInTheDocument();
  });

  // The rest of the app shows an unlabeled connection by its id, so the form
  // should too rather than presenting it as nameless.
  test("names an unlabeled connection by its id when editing it", () => {
    const config = {
      ...createRandomRawConfiguration(),
      displayLabel: undefined,
    };

    renderCreateConnection(
      <CreateConnection
        existingConfig={{
          ...mergeConfiguration(null, config, new Map(), new Map()),
          totalVertices: 0,
          vertexTypes: [],
          totalEdges: 0,
          edgeTypes: [],
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue(config.id);
  });
});

describe("mapToConnectionForm", () => {
  test("maps a connection's IAM auth into form values", () => {
    const form = mapToConnectionForm("My Graph", {
      queryEngine: "openCypher",
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });

    expect(form).toMatchObject({
      name: "My Graph",
      queryEngine: "openCypher",
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });
  });

  test("maps a direct connection to the direct option", () => {
    const form = mapToConnectionForm("My Graph", {
      graphDbUrl: "https://g.example.com",
      proxyConnection: false,
    });

    expect(form.directConnection).toBe(true);
  });

  test("maps a connection without the flag to a proxy connection", () => {
    const form = mapToConnectionForm("My Graph", {
      graphDbUrl: "https://g.example.com",
    });

    expect(form.directConnection).toBe(false);
  });
});
