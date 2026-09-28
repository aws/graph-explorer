// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { configurationAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { stubDocumentUrl, TestProvider } from "@/utils/testing";

import Connections from "./Connections";

function renderConnections() {
  const store = getAppStore();
  store.set(configurationAtom, new Map());
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <Connections />
      </TooltipProvider>
    </TestProvider>,
  );
}

async function addConnection(graphDbUrl: string) {
  const user = userEvent.setup();
  // The empty list offers a second add button
  const [addButton] = screen.getAllByRole("button", {
    name: "Add New Connection",
  });
  await user.click(addButton);
  await user.type(
    screen.getByRole("textbox", { name: "Database URL" }),
    graphDbUrl,
  );
  await user.click(screen.getByRole("button", { name: "Add Connection" }));
}

describe("Connections", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The error isn't retried, so the query holds it before the persisted sync
  // failure re-renders the details pane.
  test("shows the error when the first sync of a new connection is rejected at once", async () => {
    stubDocumentUrl();
    // A fresh response per request, since a body can only be read once
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "Bad query" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    renderConnections();

    await addConnection("https://db.example.com:8182");

    expect(await screen.findByText("Bad Request")).toBeInTheDocument();
    expect(screen.queryByText("No Schema Available")).toBeNull();
  });
});
