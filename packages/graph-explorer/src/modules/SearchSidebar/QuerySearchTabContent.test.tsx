// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vite-plus/test";

import { TooltipProvider } from "@/components";
import { type AppStore, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DatabaseTimeoutError } from "@/utils";
import { DbState, FakeExplorer, TestProvider } from "@/utils/testing";

import { QuerySearchTabContent, queryTextAtom } from "./QuerySearchTabContent";

function renderQuerySearchTabContent(explorer: FakeExplorer) {
  const store = getAppStore();
  new DbState(explorer).applyTo(store);

  render(<QuerySearchTabContent />, {
    wrapper: ({ children }) => (
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </TestProvider>
    ),
  });
}

describe("QuerySearchTabContent", () => {
  test("shows the cancelled empty state, not the earlier failure, when a query is cancelled after a prior query failed", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    rawQuerySpy.mockRejectedValueOnce(
      new DatabaseTimeoutError(
        "A timeout occurred during the request.",
        500,
        {},
        "TimeLimitExceededException",
      ),
    );
    renderQuerySearchTabContent(explorer);

    await user.type(screen.getByRole("textbox", { name: "Query" }), "g.V()");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await screen.findByRole("heading", { name: "Database query timed out" });

    // The second query hangs until cancelled.
    rawQuerySpy.mockImplementation(() => new Promise(() => {}));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    await screen.findByRole("heading", { name: "Search Query" });
    expect(
      screen.queryByRole("heading", { name: "Database query timed out" }),
    ).not.toBeInTheDocument();
  });
});

describe("QuerySearchTabContent query editor", () => {
  function renderWithStore(explorer: FakeExplorer, store: AppStore) {
    new DbState(explorer).applyTo(store);

    render(<QuerySearchTabContent />, {
      wrapper: ({ children }) => (
        <TestProvider client={createQueryClient()} store={store}>
          <TooltipProvider>{children}</TooltipProvider>
        </TestProvider>
      ),
    });
  }

  test.each([
    ["Cmd+Enter", "{Meta>}{Enter}{/Meta}"],
    ["Ctrl+Enter", "{Control>}{Enter}{/Control}"],
  ])("submits the query with %s", async (_shortcut, keys) => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const rawQuerySpy = vi
      .spyOn(explorer, "rawQuery")
      .mockResolvedValue({ results: [], rawResponse: {} });
    renderWithStore(explorer, getAppStore());

    const textbox = screen.getByRole("textbox", { name: "Query" });
    await user.type(textbox, "g.V()");
    await user.keyboard(keys);

    await vi.waitFor(() =>
      expect(rawQuerySpy).toHaveBeenCalledWith(
        { query: "g.V()" },
        expect.anything(),
      ),
    );
  });

  test("disables Submit while the query runs", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    vi.spyOn(explorer, "rawQuery").mockImplementation(
      () => new Promise(() => {}),
    );
    renderWithStore(explorer, getAppStore());

    await user.type(screen.getByRole("textbox", { name: "Query" }), "g.V()");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await screen.findByRole("button", { name: "Cancel" });

    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("stores the typed query in queryTextAtom", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    renderWithStore(new FakeExplorer(), store);

    await user.type(screen.getByRole("textbox", { name: "Query" }), "g.V()");

    expect(store.get(queryTextAtom)).toBe("g.V()");
  });

  test("opens with the stored query", () => {
    const store = getAppStore();
    store.set(queryTextAtom, "g.V().limit(1)");
    renderWithStore(new FakeExplorer(), store);

    expect(screen.getByRole("textbox", { name: "Query" })).toHaveValue(
      "g.V().limit(1)",
    );
  });
});
