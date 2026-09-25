// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { configurationAtom, getAppStore } from "@/core";
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

describe("CreateConnection", () => {
  test("does not render the removed proxy server controls", () => {
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    // Proves the queries below fail on absence rather than a wrong name
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    ).toBeInTheDocument();

    // The placeholder must include the port so copying its shape doesn't
    // produce a connection that silently fails against the default HTTPS port
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toHaveAttribute(
      "placeholder",
      "https://neptune-cluster.amazonaws.com:8182",
    );

    expect(
      screen.queryByRole("textbox", { name: "Public or Proxy Endpoint" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Using Proxy-Server" }),
    ).toBeNull();
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

  test("labels the override field Neighbor Expansion Limit", async () => {
    const user = userEvent.setup();
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("checkbox", {
        name: /Override Default Neighbor Expansion Limit/,
      }),
    );

    expect(
      screen.getByRole("spinbutton", { name: "Neighbor Expansion Limit" }),
    ).toBeInTheDocument();
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
});
