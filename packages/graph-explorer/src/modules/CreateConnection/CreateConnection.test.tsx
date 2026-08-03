// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { configurationAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { TestProvider } from "@/utils/testing";

import CreateConnection from "./CreateConnection";

function renderCreateConnection() {
  const store = getAppStore();
  store.set(configurationAtom, new Map());

  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <CreateConnection onClose={vi.fn()} />
      </TooltipProvider>
    </TestProvider>,
  );

  return store;
}

describe("CreateConnection", () => {
  test("removes newlines and surrounding whitespace from URL fields", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection();

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  https://proxy.example.com/{Enter}path  ",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Using Proxy-Server" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Graph Connection URL" }),
      "  https://database.example.com/{Enter}graph  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection).toMatchObject({
      connection: {
        url: "https://proxy.example.com/path",
        graphDbUrl: "https://database.example.com/graph",
      },
    });
  });

  test("rejects a URL that is empty after normalization", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection();

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  {Enter}  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    expect(store.get(configurationAtom)).toHaveLength(0);
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });
});
