// @vitest-environment happy-dom
import type { ConnectionConfig } from "@shared/types";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { mergeConfiguration } from "@/core/StateProvider/configuration";
import { DbState, TestProvider } from "@/utils/testing";

import ConnectionDetail from "./ConnectionDetail";

function renderDetail(connection: ConnectionConfig) {
  const state = new DbState();
  state.activeConfig = { ...state.activeConfig, connection };
  const store = getAppStore();
  state.applyTo(store);
  const config = {
    ...mergeConfiguration(null, state.activeConfig, new Map(), new Map()),
    totalVertices: 0,
    vertexTypes: [],
    totalEdges: 0,
    edgeTypes: [],
  };

  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <ConnectionDetail config={config} />
      </TooltipProvider>
    </TestProvider>,
  );
}

describe("ConnectionDetail", () => {
  test("marks a direct connection as deprecated and explains how to switch", async () => {
    const user = userEvent.setup();
    renderDetail({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });

    const marker = screen.getByText("Direct from browser (deprecated)");
    await user.hover(within(marker).getByRole("button"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Requests for this connection go from your browser to the database instead of through the Graph Explorer server. This option will be removed in a future release. To switch, edit the connection and uncheck Connect directly from the browser (deprecated) under Advanced options.",
    );
  });

  test("does not mark a proxy connection as direct", () => {
    renderDetail({ graphDbUrl: "https://my-neptune:8182" });

    // Proves the query below fails on absence rather than an unrendered panel
    expect(screen.getByText("https://my-neptune:8182")).toBeInTheDocument();
    expect(screen.queryByText(/Direct from browser/)).toBeNull();
  });

  // The value is clamped to two lines, so the full URL has to stay reachable
  test("offers the full database URL on hover", () => {
    const graphDbUrl = `https://my-neptune:8182/${"segment/".repeat(20)}`;
    renderDetail({ graphDbUrl });

    expect(
      screen.getByTitle(graphDbUrl.replace(/\/$/, "")),
    ).toBeInTheDocument();
  });
});
