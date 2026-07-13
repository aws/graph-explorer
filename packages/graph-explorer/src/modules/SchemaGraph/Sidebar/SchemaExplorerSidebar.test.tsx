// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
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

/**
 * Seeds the sidebar open on the Details tab so tests that assert the default
 * rendered content aren't affected by the random layout DbState applies.
 */
function stateWithDetailsTab() {
  return new DbState().withSchemaViewLayout({
    activeSidebarItem: "details",
    sidebar: { width: 400 },
  });
}

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
    renderSidebar(stateWithDetailsTab());

    expect(screen.getByText("Empty Selection")).toBeInTheDocument();
  });

  test("shows details and styles sidebar tabs", () => {
    const state = new DbState();
    renderSidebar(state);

    const sidebarTablist = document.querySelector(
      '[role="tablist"][aria-orientation="vertical"]',
    )!;
    const tabs = within(sidebarTablist as HTMLElement).getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });

  test("renders vertex styling content when opening the styles tab", async () => {
    const user = userEvent.setup();
    const state = stateWithDetailsTab();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderSidebar(state);

    await user.click(screen.getByRole("tab", { name: "Styles" }));

    expect(screen.getByText("Airport")).toBeInTheDocument();
  });

  test("renders edge styling content when switching to the edges tab", async () => {
    const user = userEvent.setup();
    const state = stateWithDetailsTab();
    const source = createTestableVertex().with({ types: ["Airport"] });
    const target = createTestableVertex().with({ types: ["City"] });
    const edge = createTestableEdge()
      .with({ type: "locatedIn" })
      .withSource(source)
      .withTarget(target);
    state.addTestableEdgeToGraph(edge);

    renderSidebar(state);

    await user.click(screen.getByRole("tab", { name: "Styles" }));

    // The inner tab label varies by query engine (Edges / Relationships), so
    // select by position within the horizontal tablist that just appeared.
    const horizontalTablist = document.querySelector(
      '[role="tablist"][aria-orientation="horizontal"]',
    )!;
    const innerTabs = within(horizontalTablist as HTMLElement).getAllByRole(
      "tab",
    );
    await user.click(innerTabs[1]);

    expect(screen.getByText("locatedIn")).toBeInTheDocument();
  });

  test("toggles a vertex type's visibility from the styles tab", async () => {
    const user = userEvent.setup();
    const state = stateWithDetailsTab();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderSidebar(state);

    await user.click(screen.getByRole("tab", { name: "Styles" }));

    const toggle = screen.getByRole("button", {
      name: "Hide Airport from schema view",
    });
    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Show Airport in schema view" }),
    ).toBeInTheDocument();
  });

  test("collapses sidebar when clicking the active tab", async () => {
    const user = userEvent.setup();
    renderSidebar(stateWithDetailsTab());

    expect(screen.getByText("Empty Selection")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Selection Details" }));

    expect(screen.queryByText("Empty Selection")).not.toBeInTheDocument();
  });

  test("reopens sidebar when clicking a tab while collapsed", async () => {
    const user = userEvent.setup();
    const state = stateWithDetailsTab();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderSidebar(state);

    await user.click(screen.getByRole("tab", { name: "Selection Details" }));
    expect(screen.queryByText("Empty Selection")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Styles" }));
    expect(screen.getByText("Airport")).toBeInTheDocument();
  });
});
