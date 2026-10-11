// @vitest-environment happy-dom

import { queryEngineOptions } from "@shared/types";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { Route, Routes } from "react-router";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import type { ConnectionId, SavedConnection } from "@/connections";

import { TooltipProvider } from "@/components";
import * as defaultConnection from "@/connections/defaultConnection";
import { type AppStore, getAppStore } from "@/core";
import Connect from "@/routes/Connect";
import { logger } from "@/utils";
import {
  createRandomSavedConnection,
  stubDocumentUrl,
  TestProvider,
} from "@/utils/testing";

import AppStatusLoader from "./AppStatusLoader";
import { createQueryClient } from "./queryClient";
import { savedConnectionsAtom } from "./StateProvider";

function mockDefaultConnection(configs: SavedConnection[]) {
  vi.spyOn(defaultConnection, "fetchDefaultConnection").mockResolvedValue(
    configs,
  );
}

function renderAppStatusLoader(store: AppStore) {
  const client = createQueryClient();
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
  mockDefaultConnection([createRandomSavedConnection()]);

  const store = getAppStore();
  const writeCounts = vi.fn();
  const unsub = store.sub(savedConnectionsAtom, () => {
    writeCounts(store.get(savedConnectionsAtom).size);
  });

  const { findByText } = renderAppStatusLoader(store);

  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(1);

  unsub();

  // The default connection is written exactly once; a looping effect would
  // keep replacing the map with a fresh reference and pile up writes.
  expect(writeCounts.mock.calls.length).toBe(1);
});

test("seeds one connection per query engine with a single write", async () => {
  const configs = queryEngineOptions.map(() => createRandomSavedConnection());
  mockDefaultConnection(configs);

  const store = getAppStore();
  const writeCounts = vi.fn();
  const unsub = store.sub(savedConnectionsAtom, () => {
    writeCounts(store.get(savedConnectionsAtom).size);
  });

  const { findByText } = renderAppStatusLoader(store);

  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(configs.length);

  unsub();

  // All engines are seeded in one write, and the effect settles afterwards.
  expect(writeCounts.mock.calls.length).toBe(1);
});

test("re-adds the default connection after the last connection is deleted", async () => {
  mockDefaultConnection([createRandomSavedConnection()]);

  const store = getAppStore();
  const { findByText } = renderAppStatusLoader(store);

  // Initial load adds the default connection.
  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(1);

  // Deleting the last connection empties the store.
  act(() => {
    store.set(savedConnectionsAtom, new Map());
  });

  // The default connection is re-added and the app becomes ready again
  // instead of stalling on the "Reading configuration..." boundary.
  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(1);
});

test("renders the app when no default connection is configured", async () => {
  mockDefaultConnection([]);

  const store = getAppStore();
  const { findByText } = renderAppStatusLoader(store);

  // With no default to seed, the app falls through to its children rather
  // than stalling on a loading state, and logs that none were found.
  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(0);
  expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
    "No default connections found",
  );

  // Emptying the store keeps the app rendered rather than showing a spinner.
  act(() => {
    store.set(savedConnectionsAtom, new Map());
  });

  await findByText("ready");
  expect(store.get(savedConnectionsAtom).size).toBe(0);
});

test("shows a renamed reverse proxy mount without retrying", async () => {
  stubDocumentUrl("http://localhost/renamed/");
  onTestFinished(() => stubDocumentUrl());
  const fetchSpy = vi.spyOn(defaultConnection, "fetchDefaultConnection");

  const store = getAppStore();
  const { findByText, queryByText } = renderAppStatusLoader(store);

  // The default findBy timeout is shorter than the first retry delay, so
  // this only passes when the error is shown on the first failure.
  await findByText("Reverse proxy misconfigured");
  expect(queryByText("ready")).toBeNull();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

describe("AppStatusLoader URL params + default connection", () => {
  const matchingUrl = "https://default-match.neptune.amazonaws.com";

  const matchingDefaultConnection: SavedConnection = {
    id: "Default Connection" as ConnectionId,
    displayLabel: "Default Connection",
    connection: {
      queryEngine: "gremlin",
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
      <TestProvider
        client={queryClient}
        store={store}
        initialEntries={[`/connect${searchFor(matchingUrl)}`]}
      >
        <TooltipProvider>
          <AppStatusLoader>
            <Routes>
              <Route path="/connect" element={<Connect />} />
              <Route path="/graph-explorer" element={<div>graph canvas</div>} />
            </Routes>
          </AppStatusLoader>
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
      screen.queryByText("Add connection from link"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Connection" }),
    ).not.toBeInTheDocument();
  });
});
