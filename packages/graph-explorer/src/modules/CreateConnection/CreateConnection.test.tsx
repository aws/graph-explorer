// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import { TooltipProvider } from "@/components";
import { type ConfigurationId, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, TestProvider } from "@/utils/testing";

import CreateConnection, { mapToConnectionForm } from "./CreateConnection";

function renderCreateConnection(ui: React.ReactElement) {
  const state = new DbState();
  const store = getAppStore();
  state.applyTo(store);
  const queryClient = createQueryClient();

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </TestProvider>
    ),
  });
}

describe("CreateConnection", () => {
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
});

describe("mapToConnectionForm", () => {
  test("maps a connection's IAM auth into form values", () => {
    const form = mapToConnectionForm({
      id: "url-https://g.example.com-openCypher" as ConfigurationId,
      displayLabel: "My Graph",
      connection: {
        url: "https://localhost",
        queryEngine: "openCypher",
        proxyConnection: true,
        graphDbUrl: "https://g.example.com",
        awsAuthEnabled: true,
        awsRegion: "us-west-2",
        serviceType: "neptune-graph",
      },
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

  test("returns undefined when given no config", () => {
    expect(mapToConnectionForm(undefined)).toBeUndefined();
  });
});
