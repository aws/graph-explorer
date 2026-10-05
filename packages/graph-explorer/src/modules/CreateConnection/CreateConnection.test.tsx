// @vitest-environment happy-dom

import type { ConnectionConfig } from "@shared/types";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import {
  createConnectionId,
  transformLegacyConnection,
  type SavedConnection,
} from "@/connections";
import {
  allGraphSessionsAtom,
  type ConfigurationContextProps,
  savedConnectionsAtom,
  getAppStore,
  schemaAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { mergeConfiguration } from "@/core/StateProvider/typeConfigs";
import {
  createRandomEdgeId,
  createRandomSavedConnection,
  createRandomSchema,
  createRandomVertexId,
  TestProvider,
} from "@/utils/testing";

import { mapToConnectionForm } from "./connectionFormModel";
import CreateConnection from "./CreateConnection";

function renderCreateConnection(ui: React.ReactElement) {
  const store = getAppStore();
  store.set(savedConnectionsAtom, new Map());

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
      screen.getByRole("checkbox", { name: "Use AWS IAM authentication" }),
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
      expect(store.get(savedConnectionsAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(savedConnectionsAtom).values();
    expect(savedConnection).toMatchObject({
      connection: {
        graphDbUrl: "https://database.example.com/graph",
      },
    });
    expect(savedConnection.connection).not.toHaveProperty("url");
    expect(savedConnection.connection).not.toHaveProperty("proxyConnection");
  });

  describe("connection method", () => {
    const proxyOption = { name: "Via proxy server" };
    const browserOption = { name: "Directly via browser" };
    const iamOption = { name: "Use AWS IAM authentication" };

    function renderEditing(connection: ConnectionConfig) {
      const existingConnection = {
        ...createRandomSavedConnection(),
        connection,
      };
      const store = renderCreateConnection(
        <CreateConnection
          existingConfig={{
            ...mergeConfiguration(
              null,
              existingConnection,
              new Map(),
              new Map(),
            ),
            totalVertices: 0,
            vertexTypes: [],
            totalEdges: 0,
            edgeTypes: [],
          }}
          onClose={vi.fn()}
        />,
      );
      store.set(
        savedConnectionsAtom,
        new Map([[existingConnection.id, existingConnection]]),
      );
      return { store, existingConnection };
    }

    test("connects through the proxy server by default", () => {
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      expect(screen.getByRole("radio", proxyOption)).toBeChecked();
      expect(screen.getByRole("radio", browserOption)).not.toBeChecked();
    });

    test("moves between the methods with the arrow keys", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      await user.click(screen.getByRole("radio", proxyOption));
      // Radix moves focus on a timer, so the key is held until the focus lands
      await user.keyboard("{ArrowDown>}");
      await waitFor(() => {
        expect(screen.getByRole("radio", browserOption)).toBeChecked();
      });
      await user.keyboard("{/ArrowDown}");
    });

    test("says the server signs requests with its own credentials", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      expect(screen.queryByText(/with its own AWS credentials/)).toBeNull();

      await user.click(screen.getByRole("checkbox", iamOption));

      expect(
        screen.getByText(/signs requests with its own AWS credentials/),
      ).toBeInTheDocument();
    });

    test("hides the IAM controls when connecting directly via the browser", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      await user.click(screen.getByRole("checkbox", iamOption));
      await user.click(screen.getByRole("radio", browserOption));

      expect(screen.queryByRole("checkbox", iamOption)).toBeNull();
      expect(screen.queryByRole("textbox", { name: "AWS Region" })).toBeNull();
    });

    test("restores the IAM settings when switching back to the proxy server", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      await user.click(screen.getByRole("checkbox", iamOption));
      await user.type(
        screen.getByRole("textbox", { name: "AWS Region" }),
        "us-west-2",
      );
      await user.click(screen.getByRole("radio", browserOption));
      await user.click(screen.getByRole("radio", proxyOption));

      expect(screen.getByRole("checkbox", iamOption)).toBeChecked();
      expect(screen.getByRole("textbox", { name: "AWS Region" })).toHaveValue(
        "us-west-2",
      );
    });

    test("selects a method by clicking its description", async () => {
      const user = userEvent.setup();
      renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

      await user.click(
        screen.getByText(
          "Your browser reaches the database itself, so the database must allow CORS from this page. No AWS IAM authentication, query cancellation or server-side logging.",
        ),
      );

      expect(screen.getByRole("radio", browserOption)).toBeChecked();
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
      // IAM set up before switching to the browser must not be saved, since
      // the region it requires is hidden and a direct request is never signed.
      await user.click(screen.getByRole("checkbox", iamOption));
      await user.click(screen.getByRole("radio", browserOption));
      await user.click(screen.getByRole("button", { name: "Add Connection" }));

      await waitFor(() => {
        expect(store.get(savedConnectionsAtom)).toHaveLength(1);
      });

      const [savedConnection] = store.get(savedConnectionsAtom).values();
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
        await user.click(screen.getByRole("radio", browserOption));
        await user.click(
          screen.getByRole("button", { name: "Add Connection" }),
        );

        expect(store.get(savedConnectionsAtom)).toHaveLength(0);
        expect(
          screen.getByText(
            "Directly via browser needs a full URL starting with http:// or https://",
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
        expect(store.get(savedConnectionsAtom)).toHaveLength(1);
      });
    });

    test("shows an existing direct connection as Directly via browser", () => {
      renderEditing({
        graphDbUrl: "https://database.example.com:8182",
        proxyConnection: false,
      });

      expect(screen.getByRole("radio", browserOption)).toBeChecked();
      expect(
        screen.getByRole("button", { name: "Advanced options" }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    test("keeps an existing proxy connection on the proxy server", async () => {
      const user = userEvent.setup();
      const { store, existingConnection } = renderEditing({
        graphDbUrl: "https://database.example.com:8182",
      });

      expect(screen.getByRole("radio", proxyOption)).toBeChecked();

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      const savedConnection = store
        .get(savedConnectionsAtom)
        .get(existingConnection.id);
      expect(savedConnection?.connection).toMatchObject({
        graphDbUrl: "https://database.example.com:8182",
      });
      expect(savedConnection?.connection).not.toHaveProperty("proxyConnection");
    });

    test("saves an existing direct connection back to a proxy connection", async () => {
      const user = userEvent.setup();
      const { store, existingConnection } = renderEditing({
        graphDbUrl: "https://database.example.com:8182",
        proxyConnection: false,
      });

      await user.click(screen.getByRole("radio", proxyOption));

      expect(screen.getByRole("checkbox", iamOption)).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      const savedConnection = store
        .get(savedConnectionsAtom)
        .get(existingConnection.id);
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
      const connection: SavedConnection = {
        ...createRandomSavedConnection(),
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
            ...mergeConfiguration(null, connection, new Map(), new Map()),
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
      store.set(savedConnectionsAtom, new Map([[connection.id, connection]]));
      store.set(schemaAtom, new Map([[connection.id, schema]]));
      store.set(allGraphSessionsAtom, new Map([[connection.id, session]]));
      return { store, connection, schema, session };
    }

    test("keeps the schema and graph session when saved unchanged", async () => {
      const user = userEvent.setup();
      const { store, connection, schema, session } = renderUpgradedConnection();

      // The dialog must show the database URL, not the legacy proxy url that
      // the stored shape also carried.
      expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
        "https://database.example.com:8182",
      );

      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      expect(store.get(schemaAtom).get(connection.id)).toBe(schema);
      expect(store.get(allGraphSessionsAtom).get(connection.id)).toBe(session);
    });

    test("clears the schema and graph session when the Database URL changes", async () => {
      const user = userEvent.setup();
      const { store, connection } = renderUpgradedConnection();

      const databaseUrl = screen.getByRole("textbox", { name: "Database URL" });
      await user.clear(databaseUrl);
      await user.type(databaseUrl, "https://other-database.example.com:8182");
      await user.click(
        screen.getByRole("button", { name: "Update Connection" }),
      );

      expect(store.get(schemaAtom).has(connection.id)).toBe(false);
      expect(store.get(allGraphSessionsAtom).has(connection.id)).toBe(false);
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
    const configId = createConnectionId();
    const store = getAppStore();
    const connection: ConnectionConfig = {
      graphDbUrl: "https://db.example.com",
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
    };
    store.set(
      savedConnectionsAtom,
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

    expect(store.get(savedConnectionsAtom)).toHaveLength(0);
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });

  test("prefills the form from initialValues without entering edit mode", () => {
    renderCreateConnection(
      <CreateConnection
        initialValues={mapToConnectionForm("Seeded Graph", {
          graphDbUrl: "https://seed.neptune.amazonaws.com",
        })}
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

  test("lets the Query Language be changed for Neptune Analytics", () => {
    renderCreateConnection(
      <CreateConnection
        initialValues={mapToConnectionForm("My Connection", {
          graphDbUrl: "https://g.example.com",
          queryEngine: "openCypher",
          awsAuthEnabled: true,
          awsRegion: "us-east-1",
          serviceType: "neptune-graph",
        })}
        onClose={vi.fn()}
      />,
    );

    const queryLanguage = screen.getByRole("combobox", {
      name: "Query Language",
    });
    expect(queryLanguage).toHaveTextContent("OpenCypher - PG (Property Graph)");
    expect(queryLanguage).toBeEnabled();
  });

  test("keeps the chosen Query Language after choosing Neptune Analytics", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "https://g.example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Use AWS IAM authentication" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "AWS Region" }),
      "us-east-1",
    );
    await user.click(screen.getByRole("combobox", { name: "Service Type" }));
    await user.click(screen.getByRole("option", { name: "Neptune Analytics" }));
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(savedConnectionsAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(savedConnectionsAtom).values();
    expect(savedConnection.connection).toStrictEqual({
      graphDbUrl: "https://g.example.com",
      queryEngine: "gremlin",
      awsAuthEnabled: true,
      serviceType: "neptune-graph",
      awsRegion: "us-east-1",
      fetchTimeoutMs: undefined,
      nodeExpansionLimit: undefined,
    });
  });

  test("saves no fetch timeout when its field is cleared", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "https://g.example.com",
    );
    await openAdvancedOptions(user);
    await user.click(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    );
    await user.clear(
      screen.getByRole("spinbutton", { name: "Fetch Timeout (ms)" }),
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(savedConnectionsAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(savedConnectionsAtom).values();
    expect(savedConnection.connection).toStrictEqual({
      graphDbUrl: "https://g.example.com",
      queryEngine: "gremlin",
      awsAuthEnabled: false,
      serviceType: "neptune-db",
      awsRegion: "",
      fetchTimeoutMs: undefined,
      nodeExpansionLimit: undefined,
    });
  });

  // The rest of the app shows an unlabeled connection by its id, so the form
  // should too rather than presenting it as nameless.
  test("names an unlabeled connection by its id when editing it", () => {
    const connection = {
      ...createRandomSavedConnection(),
      displayLabel: undefined,
    };

    renderCreateConnection(
      <CreateConnection
        existingConfig={{
          ...mergeConfiguration(null, connection, new Map(), new Map()),
          totalVertices: 0,
          vertexTypes: [],
          totalEdges: 0,
          edgeTypes: [],
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue(connection.id);
  });
});
