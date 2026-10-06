// @vitest-environment happy-dom
import type { ConnectionConfig } from "@shared/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { mergeConfiguration } from "@/core/StateProvider/typeConfigs";
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
  test.each([
    { name: "direct", route: { proxyConnection: false } },
    { name: "proxy", route: {} },
  ])("shows no route mark on a $name connection", ({ route }) => {
    renderDetail({ graphDbUrl: "https://my-neptune:8182", ...route });

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
