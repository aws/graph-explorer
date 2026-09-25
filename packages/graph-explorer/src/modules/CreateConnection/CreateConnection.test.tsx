// @vitest-environment happy-dom

import type { ConnectionConfig } from "@shared/types";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import {
  type ConfigurationContextProps,
  configurationAtom,
  createNewConfigurationId,
  getAppStore,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { mergeConfiguration } from "@/core/StateProvider/configuration";
import { createRandomRawConfiguration, TestProvider } from "@/utils/testing";

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
  test("removes newlines and surrounding whitespace from URL fields", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  https://proxy.example.com/{Enter}path  ",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Using Proxy-Server" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Graph Connection URL" }),
      "  https://database.example.com/{Enter}graph  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection).toMatchObject({
      connection: {
        url: "https://proxy.example.com/path",
        graphDbUrl: "https://database.example.com/graph",
      },
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
      url: "https://proxy.example.com",
      graphDbUrl: "",
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
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
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
          proxyConnection: true,
          graphDbUrl: "https://seed.neptune.amazonaws.com",
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Seeded Graph");
    expect(screen.getByLabelText("Graph Connection URL")).toHaveValue(
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
      url: "https://localhost",
      queryEngine: "openCypher",
      proxyConnection: true,
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });

    expect(form).toMatchObject({
      name: "My Graph",
      queryEngine: "openCypher",
      proxyConnection: true,
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });
  });
});
