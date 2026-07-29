// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
} from "@/utils/testing";

import { graphViewStylesTabAtom, Styles } from "./Styles";

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
  }) => data?.map((item, index) => itemContent(index, item)),
}));

function renderStyles(state: DbState) {
  const store = getAppStore();
  state.applyTo(store);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <TooltipProvider>
            <Styles onClose={() => {}} tabAtom={graphViewStylesTabAtom} />
          </TooltipProvider>
        </Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("Styles", () => {
  test("shows vertex styling on the default tab", () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderStyles(state);

    expect(screen.getByText("Airport")).toBeInTheDocument();
  });

  test("has a link to the styles settings page", () => {
    const state = new DbState();
    renderStyles(state);

    const link = screen.getByRole("link", { name: "Style settings" });
    expect(link).toHaveAttribute("href", "/settings/styles");
  });

  test("shows edge styling after switching to the edges tab", async () => {
    const user = userEvent.setup();
    const state = new DbState();
    const source = createTestableVertex().with({ types: ["Airport"] });
    const target = createTestableVertex().with({ types: ["City"] });
    const edge = createTestableEdge()
      .with({ type: "locatedIn" })
      .withSource(source)
      .withTarget(target);
    state.addTestableEdgeToGraph(edge);

    renderStyles(state);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);

    expect(screen.getByText("locatedIn")).toBeInTheDocument();
  });

  test("does not show a vertex visibility toggle for the main graph view", () => {
    const state = new DbState();
    const vertex = createTestableVertex().with({ types: ["Airport"] });
    state.addTestableVertexToGraph(vertex);

    renderStyles(state);

    expect(
      screen.queryByRole("button", { name: /schema view/ }),
    ).not.toBeInTheDocument();
  });
});
