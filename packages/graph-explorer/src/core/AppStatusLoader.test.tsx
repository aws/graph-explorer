// @vitest-environment happy-dom
import { queryEngineOptions } from "@shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";

import { TooltipProvider } from "@/components";
import { type AppStore, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import Connect from "@/routes/Connect";
import { logger } from "@/utils";
import { createRandomRawConfiguration, TestProvider } from "@/utils/testing";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import AppStatusLoader from "./AppStatusLoader";
import * as defaultConnection from "./defaultConnection";
import { configurationAtom } from "./StateProvider";

function mockDefaultConnection(configs: RawConfiguration[]) {
  vi.spyOn(defaultConnection, "fetchDefaultConnection").mockResolvedValue(
    configs,
  );
}

function renderAppStatusLoader(store: AppStore) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <AppStatusLoader>
          <div>ready</div>
        </AppStatusLoader>
      </Provider>
    </QueryClientProvider>,
  );
}

test("adding the default connection settles instead of looping", async () => {
  mockDefaultConnection([createRandomRawConfiguration()]);

  const store = getAppStore();
  const writeCounts = vi.fn();
  const unsub = store.sub(configurationAtom, () => {
    writeCounts(store.get(configurationAtom).size);
  });

  const { findByText } = renderAppStatusLoader(store);

  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(1);

  unsub();

  // The default connection is written exactly once; a looping effect would
  // keep replacing the map with a fresh reference and pile up writes.
  expect(writeCounts.mock.calls.length).toBe(1);
});

test("seeds one connection per query engine with a single write", async () => {
  const configs = queryEngineOptions.map(() => createRandomRawConfiguration());
  mockDefaultConnection(configs);

  const store = getAppStore();
  const writeCounts = vi.fn();
  const unsub = store.sub(configurationAtom, () => {
    writeCounts(store.get(configurationAtom).size);
  });

  const { findByText } = renderAppStatusLoader(store);

  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(configs.length);

  unsub();

  // All engines are seeded in one write, and the effect settles afterwards.
  expect(writeCounts.mock.calls.length).toBe(1);
});

test("re-adds the default connection after the last connection is deleted", async () => {
  mockDefaultConnection([createRandomRawConfiguration()]);

  const store = getAppStore();
  const { findByText } = renderAppStatusLoader(store);

  // Initial load adds the default connection.
  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(1);

  // Deleting the last connection empties the store.
  act(() => {
    store.set(configurationAtom, new Map());
  });

  // The default connection is re-added and the app becomes ready again
  // instead of stalling on the "Reading configuration..." boundary.
  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(1);
});

test("renders the app when no default connection is configured", async () => {
  mockDefaultConnection([]);

  const store = getAppStore();
  const { findByText } = renderAppStatusLoader(store);

  // With no default to seed, the app falls through to its children rather
  // than stalling on a loading state, and logs that none were found.
  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(0);
  expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
    "No default connections found",
  );

  // Emptying the store keeps the app rendered rather than showing a spinner.
  act(() => {
    store.set(configurationAtom, new Map());
  });

  await findByText("ready");
  expect(store.get(configurationAtom).size).toBe(0);
});

describe("AppStatusLoader URL params + default connection", () => {
  const matchingUrl = "https://default-match.neptune.amazonaws.com";

  const matchingDefaultConnection: RawConfiguration = {
    id: "Default Connection" as ConfigurationId,
    displayLabel: "Default Connection",
    connection: {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: matchingUrl,
    },
  };

  function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
    return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
  }

  test("does not prompt to create when a loading default connection matches the connect URL", async () => {
    mockDefaultConnection([matchingDefaultConnection]);

    const store = getAppStore();
    const queryClient = createQueryClient();

    // Enter the connect route before the default connection has loaded. The
    // loader gates the route behind a spinner until the default arrives, so the
    // route must resolve against the loaded default (a no-op) rather than
    // prompting to create a duplicate.
    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[`/connect${searchFor(matchingUrl)}`]}>
            <AppStatusLoader>
              <Routes>
                <Route path="/connect" element={<Connect />} />
                <Route
                  path="/graph-explorer"
                  element={<div>graph canvas</div>}
                />
              </Routes>
            </AppStatusLoader>
          </MemoryRouter>
        </TooltipProvider>
      </TestProvider>,
    );

    // Once the default connection loads, the route is a no-op and redirects to
    // the graph canvas.
    await waitFor(() => {
      expect(screen.getByText("graph canvas")).toBeInTheDocument();
    });

    // The URL targets the connection the default provides, so we must NOT
    // see a create-connection prompt.
    expect(
      screen.queryByText("Create connection from link"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Connection" }),
    ).not.toBeInTheDocument();
  });
});
