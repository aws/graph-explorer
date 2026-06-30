// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { TestProvider } from "@/utils/testing";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

const matchingUrl = "https://default-match.neptune.amazonaws.com";

const defaultConnection: RawConfiguration = {
  id: "Default Connection" as ConfigurationId,
  displayLabel: "Default Connection",
  connection: {
    url: "https://localhost",
    queryEngine: "gremlin",
    proxyConnection: true,
    graphDbUrl: matchingUrl,
  },
};

vi.mock("./defaultConnection", () => ({
  fetchDefaultConnection: vi.fn().mockResolvedValue([defaultConnection]),
}));

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

describe("AppStatusLoader URL params + default connection", () => {
  test("does not prompt to create when a loading default connection matches the connect URL", async () => {
    const AppStatusLoader = (await import("./AppStatusLoader")).default;
    const Connect = (await import("@/routes/Connect")).default;
    const store = getAppStore();
    const queryClient = createQueryClient();

    // Enter the connect route before the default connection has loaded. The
    // loader gates the route behind a spinner until the default arrives, so the
    // route must resolve against the loaded default (a no-op) rather than
    // prompting to create a duplicate.
    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[`/connect${searchFor(matchingUrl)}`]}>
            <AppStatusLoader>
              <Routes>
                <Route path="/connect" element={<Connect />} />
                <Route
                  path="/graph-explorer"
                  element={<div>graph canvas</div>}
                />
              </Routes>
            </AppStatusLoader>
          </MemoryRouter>
        </TooltipProvider>
      </TestProvider>,
    );

    // Once the default connection loads, the route is a no-op and redirects to
    // the graph canvas.
    await waitFor(() => {
      expect(screen.getByText("graph canvas")).toBeInTheDocument();
    });

    // The URL targets the connection the default provides, so we must NOT
    // see a create-connection prompt.
    expect(
      screen.queryByText("Create connection from link"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Connection" }),
    ).not.toBeInTheDocument();
  });
});
