// @vitest-environment happy-dom
import { queryEngineOptions } from "@shared/types";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { Provider } from "jotai";
import { vi } from "vitest";

import { type AppStore, getAppStore } from "@/core";
import { logger } from "@/utils";
import { createRandomRawConfiguration, stubDocumentUrl } from "@/utils/testing";

import type { RawConfiguration } from "./ConfigurationProvider";

import AppStatusLoader from "./AppStatusLoader";
import * as defaultConnection from "./defaultConnection";
import { createQueryClient } from "./queryClient";
import { configurationAtom } from "./StateProvider";

function mockDefaultConnection(configs: RawConfiguration[]) {
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

test("shows a renamed reverse proxy mount without retrying", async () => {
  stubDocumentUrl("http://localhost/renamed/");
  const fetchSpy = vi.spyOn(defaultConnection, "fetchDefaultConnection");

  const store = getAppStore();
  const { findByText, queryByText } = renderAppStatusLoader(store);

  // The default findBy timeout is shorter than the first retry delay, so
  // this only passes when the error is shown on the first failure.
  await findByText("Reverse proxy misconfigured");
  expect(queryByText("ready")).toBeNull();
  expect(fetchSpy).toHaveBeenCalledTimes(1);

  stubDocumentUrl();
});
