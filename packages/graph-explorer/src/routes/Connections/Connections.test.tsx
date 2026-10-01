// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

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

async function addConnection(graphDbUrl: string, { direct = false } = {}) {
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
  if (direct) {
    await user.click(screen.getByRole("button", { name: "Advanced options" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /Connect directly from the browser \(deprecated\)/,
      }),
    );
  }
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

  // Neither error is retried, so the query holds the error before the
  // persisted sync failure re-renders the details pane.
  describe("shows the error when the first sync of a new connection fails at once", () => {
    test("for a direct http database the https page blocks", async () => {
      stubDocumentUrl("https://localhost/explorer/");
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
      renderConnections();

      await addConnection("http://example.com:18392", { direct: true });

      expect(
        await screen.findByText("Insecure database URL"),
      ).toBeInTheDocument();
      expect(screen.queryByText("No Schema Available")).toBeNull();
    });

    test("for a proxied request the server rejects", async () => {
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
});
