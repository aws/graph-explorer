// @vitest-environment happy-dom
import type { LegacyConnectionConfig } from "@shared/types";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import {
  activeConfigurationAtom,
  configurationAtom,
  getAppStore,
  nodesAtom,
  type RawConfiguration,
  toNodeMap,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { transformConfiguration } from "@/core/StateProvider/configurationTransform";
import {
  createRandomRawConfiguration,
  createRandomVertex,
} from "@/utils/testing";
import { TestProvider } from "@/utils/testing";

import { ConnectionRow } from "./ConnectionRow";

describe("ConnectionRow", () => {
  test("clicking the already-active connection does not reset session state", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    const connection = createRandomRawConfiguration();
    const vertex = createRandomVertex();

    store.set(configurationAtom, new Map([[connection.id, connection]]));
    store.set(activeConfigurationAtom, connection.id);
    store.set(nodesAtom, toNodeMap([vertex]));

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={connection}
            isSelected={true}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    const row = screen.getByText(connection.displayLabel || connection.id);
    await user.click(row);

    const nodesAfterClick = store.get(nodesAtom);
    expect(nodesAfterClick.size).toBe(1);
    expect(nodesAfterClick.get(vertex.id)).toBeDefined();
  });

  test("clicking a different connection resets session state", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    const activeConnection = createRandomRawConfiguration();
    const otherConnection = createRandomRawConfiguration();
    const vertex = createRandomVertex();

    store.set(
      configurationAtom,
      new Map([
        [activeConnection.id, activeConnection],
        [otherConnection.id, otherConnection],
      ]),
    );
    store.set(activeConfigurationAtom, activeConnection.id);
    store.set(nodesAtom, toNodeMap([vertex]));

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={otherConnection}
            isSelected={false}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    const row = screen.getByText(
      otherConnection.displayLabel || otherConnection.id,
    );
    await user.click(row);

    const nodesAfterClick = store.get(nodesAtom);
    expect(nodesAfterClick.size).toBe(0);
  });

  // Regression: `configurationAtom`'s read-time transform migrates a legacy
  // `url`/`proxyConnection` connection to `graphDbUrl` before any consumer
  // sees it, so a row for a pre-upgrade connection still shows its endpoint.
  test("renders the endpoint for a legacy stored connection", () => {
    const store = getAppStore();
    const legacyConfig = {
      ...createRandomRawConfiguration(),
      // Stored data is not schema-validated on read, so an entry can carry a
      // legacy connection despite the compile-time `ConnectionConfig` shape.
      connection: {
        url: "https://my-neptune:8182",
        proxyConnection: false,
      } as LegacyConnectionConfig as RawConfiguration["connection"],
    };
    const [connection] = transformConfiguration(
      new Map([[legacyConfig.id, legacyConfig]]),
    ).values();

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={connection}
            isSelected={false}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(screen.getByText(/my-neptune:8182/)).toBeInTheDocument();
  });
});
