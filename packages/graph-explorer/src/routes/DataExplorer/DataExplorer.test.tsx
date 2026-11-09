// @vitest-environment happy-dom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import { TooltipProvider } from "@/components";
import { createVertexType, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createTestableVertex,
  DbState,
  mockVirtualizedLayout,
  TestProvider,
} from "@/utils/testing";

import DataExplorer from "./DataExplorer";

// Mock SchemaDiscoveryBoundary to pass through children
vi.mock("@/components/SchemaDiscoveryBoundary", () => ({
  SchemaDiscoveryBoundary: ({ children }: { children: React.ReactNode }) =>
    children,
}));

function LocationDisplay() {
  const location = useLocation();
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="location-search">{location.search}</div>
    </>
  );
}

function renderDataExplorer(initialPath: string, state: DbState) {
  const store = getAppStore();
  state.applyTo(store);

  const queryClient = createQueryClient();

  return render(
    <TestProvider
      client={queryClient}
      store={store}
      initialEntries={[initialPath]}
    >
      <TooltipProvider>
        <Routes>
          <Route path="/data-explorer" element={<DataExplorer />} />
          <Route path="/data-explorer/:vertexType" element={<DataExplorer />} />
        </Routes>
        <LocationDisplay />
      </TooltipProvider>
    </TestProvider>,
  );
}

beforeEach(mockVirtualizedLayout);

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

  test("renders empty state when no vertexType param and no vertex types", () => {
    const state = new DbState().withNoActiveSchema();

    renderDataExplorer("/data-explorer", state);

    // Should not redirect — stays at /data-explorer
    expect(screen.getByTestId("location")).toHaveTextContent("/data-explorer");
    // Should show the empty state message since there are no vertex types
    expect(screen.getByText(/no .* available/i)).toBeInTheDocument();
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

  test("shows subtitle as 'Connection: none' when no connection is active", () => {
    const state = new DbState().withNoActiveConnection();

    renderDataExplorer("/data-explorer", state);

    expect(screen.getByText("Connection: none")).toBeInTheDocument();
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

  test("filters the node type combobox and navigates to the selected type", async () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({
      types: ["Airport", "Country", "Continent"],
    });
    state.addTestableVertexToGraph(vertex);

    const { container } = renderDataExplorer("/data-explorer/Airport", state);

    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Airport");

    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "Cou" } });

    const option = await waitFor(() => screen.getByText("Country"));
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/data-explorer/Country",
      );
    });
  });

  describe("paging from the URL", () => {
    function stateWithAirport() {
      const state = new DbState();
      vi.mocked(state.explorer.keywordSearch).mockResolvedValue({
        vertices: [],
      });
      state.addTestableVertexToGraph(
        createTestableVertex().with({ types: ["Airport"] }),
      );
      return state;
    }

    async function firstSearchRequest(state: DbState) {
      await waitFor(() => {
        expect(state.explorer.keywordSearch).toHaveBeenCalled();
      });
      return vi.mocked(state.explorer.keywordSearch).mock.calls[0][0];
    }

    test("searches the page and page size from the link", async () => {
      const state = stateWithAirport();

      renderDataExplorer("/data-explorer/Airport?page=3&pageSize=50", state);

      expect(await firstSearchRequest(state)).toStrictEqual({
        vertexTypes: [createVertexType("Airport")],
        limit: 50,
        offset: 100,
      });
    });

    test("searches the first page of 20 rows when the link has no paging", async () => {
      const state = stateWithAirport();

      renderDataExplorer("/data-explorer/Airport", state);

      expect(await firstSearchRequest(state)).toStrictEqual({
        vertexTypes: [createVertexType("Airport")],
        limit: 20,
        offset: 0,
      });
    });

    test.each(["0", "-5", "2.5", "1000", "abc"])(
      "searches 20 rows when pageSize is %s",
      async pageSize => {
        const state = stateWithAirport();

        renderDataExplorer(
          `/data-explorer/Airport?page=2&pageSize=${pageSize}`,
          state,
        );

        expect(await firstSearchRequest(state)).toStrictEqual({
          vertexTypes: [createVertexType("Airport")],
          limit: 20,
          offset: 20,
        });
      },
    );

    test.each(["0", "-2", "1.5", "abc"])(
      "searches the first page when page is %s",
      async page => {
        const state = stateWithAirport();

        renderDataExplorer(
          `/data-explorer/Airport?page=${page}&pageSize=10`,
          state,
        );

        expect(await firstSearchRequest(state)).toStrictEqual({
          vertexTypes: [createVertexType("Airport")],
          limit: 10,
          offset: 0,
        });
      },
    );

    test("writes a table page size when moving to another page", async () => {
      const state = stateWithAirport();

      renderDataExplorer("/data-explorer/Airport?page=3&pageSize=abc", state);

      fireEvent.click(await screen.findByRole("button", { name: "1" }));

      await waitFor(() => {
        expect(screen.getByTestId("location-search")).toHaveTextContent(
          "?page=1&pageSize=20",
        );
      });
    });
  });
});
