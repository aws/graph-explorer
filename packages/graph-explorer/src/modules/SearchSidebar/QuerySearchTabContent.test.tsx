// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DatabaseTimeoutError } from "@/utils";
import { DbState, FakeExplorer, TestProvider } from "@/utils/testing";

import { QuerySearchTabContent } from "./QuerySearchTabContent";

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
