import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
} from "@/utils/testing";

import { SchemaExplorerSidebar } from "./SchemaExplorerSidebar";

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
  }) => data?.map((item, index) => itemContent(index, item)),
}));

function renderSidebar(state: DbState) {
  const store = getAppStore();
  state.applyTo(store);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TooltipProvider>
          <SchemaExplorerSidebar selection={null} />
        </TooltipProvider>
      </Provider>
    </QueryClientProvider>,
  );
}

describe("SchemaExplorerSidebar", () => {
  test("renders details tab by default with empty selection message", () => {
    const state = new DbState();
    renderSidebar(state);

    expect(screen.getByText("Empty Selection")).toBeInTheDocument();
  });

  test("shows three sidebar tabs", () => {
    const state = new DbState();
    renderSidebar(state);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  test("renders node styling content when clicking second tab", async () => {
    const user = userEvent.setup();
    const state = new DbState();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderSidebar(state);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);

    expect(screen.getByText("Airport")).toBeInTheDocument();
  });

  test("renders edge styling content when clicking third tab", async () => {
    const user = userEvent.setup();
    const state = new DbState();
    const source = createTestableVertex().with({ types: ["Airport"] });
    const target = createTestableVertex().with({ types: ["City"] });
    const edge = createTestableEdge()
      .with({ type: "locatedIn" })
      .withSource(source)
      .withTarget(target);
    state.addTestableEdgeToGraph(edge);

    renderSidebar(state);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    expect(screen.getByText("locatedIn")).toBeInTheDocument();
  });
});
