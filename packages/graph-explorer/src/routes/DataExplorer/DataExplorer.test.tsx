import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createTestableVertex, DbState } from "@/utils/testing";

import DataExplorer from "./DataExplorer";

// Mock SchemaDiscoveryBoundary to pass through children
vi.mock("@/components/SchemaDiscoveryBoundary", () => ({
  SchemaDiscoveryBoundary: ({ children }: { children: React.ReactNode }) =>
    children,
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderDataExplorer(initialPath: string, state: DbState) {
  const store = getAppStore();
  state.applyTo(store);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/data-explorer" element={<DataExplorer />} />
              <Route
                path="/data-explorer/:vertexType"
                element={<DataExplorer />}
              />
            </Routes>
            <LocationDisplay />
          </MemoryRouter>
        </TooltipProvider>
      </Provider>
    </QueryClientProvider>,
  );
}

describe("DataExplorer", () => {
  test("redirects to first vertex type when no vertexType param", async () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({ types: ["Person"] });
    state.addTestableVertexToGraph(vertex);

    renderDataExplorer("/data-explorer", state);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/data-explorer/Person",
      );
    });
  });

  test("renders empty shell when no vertexType param and no vertex types", () => {
    const state = new DbState().withNoActiveSchema();

    renderDataExplorer("/data-explorer", state);

    // Should not redirect — stays at /data-explorer
    expect(screen.getByTestId("location")).toHaveTextContent("/data-explorer");
    // Should not show the empty state message
    expect(screen.queryByText(/no .* available/i)).not.toBeInTheDocument();
  });

  test("shows empty state when vertexType param exists but no vertex types in schema", () => {
    const state = new DbState().withNoActiveSchema();

    renderDataExplorer("/data-explorer/Person", state);

    expect(screen.getByText(/no .* available/i)).toBeInTheDocument();
  });

  test("renders content when vertexType param and vertex types exist", () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderDataExplorer("/data-explorer/Airport", state);

    // Should stay on the same route
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/data-explorer/Airport",
    );
    // Should not show empty state
    expect(screen.queryByText(/no .* available/i)).not.toBeInTheDocument();
  });

  test("encodes vertex type in redirect URL", async () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({
      types: ["Has Space"],
    });
    state.addTestableVertexToGraph(vertex);

    renderDataExplorer("/data-explorer", state);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/data-explorer/Has%20Space",
      );
    });
  });
});
