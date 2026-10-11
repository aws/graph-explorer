import type { PropsWithChildren } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router";

import { type AppStore, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";

import { DbState } from "./DbState";

/**
 * The router entries a test starts at. Anything reading the location (a routed
 * hook, a `Link`, a `useNavigate` call) works without the test wiring its own
 * router, so nesting a second `MemoryRouter` inside this provider is a mistake.
 */
export type TestRouterOptions = {
  initialEntries?: string[];
};

export function TestProvider({
  store,
  client,
  initialEntries,
  children,
}: PropsWithChildren<
  { store: AppStore; client: QueryClient } & TestRouterOptions
>) {
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
}

export function renderHookWithState<TResult>(
  callback: () => TResult,
  state?: DbState,
  { initialEntries }: TestRouterOptions = {},
) {
  // Create default DbState if none passed
  state ??= new DbState();

  // Set values on the Jotai store
  const store = getAppStore();
  state.applyTo(store);

  // Create the query client using the mock explorer
  const queryClient = createQueryClient();
  const defaultOptions = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaultOptions,
    queries: { ...defaultOptions.queries, retry: false },
  });

  // Call the standard testing hook with TanStack Query and Jotai setup
  return renderHook(callback, {
    wrapper: props => (
      <TestProvider
        client={queryClient}
        store={store}
        initialEntries={initialEntries}
        {...props}
      />
    ),
  });
}

export function renderHookWithJotai<TResult>(
  callback: () => TResult,
  initializeState?: (store: AppStore) => void,
) {
  // Provide a way to set atom initial values
  const store = getAppStore();
  if (initializeState) {
    initializeState(store);
  }

  // Call the standard testing hook with TanStack Query and Jotai setup
  const queryClient = new QueryClient();

  return renderHook(callback, {
    wrapper: props => (
      <TestProvider client={queryClient} store={store} {...props} />
    ),
  });
}

/**
 * Settles pending React work under `act()`.
 *
 * Jotai v2 always re-rendered once right after mount, which absorbed store
 * writes that landed before `useAtomValue` subscribed. v3 drops that extra
 * render and only re-renders on an actual change, so such a write now arrives
 * as its own render after `renderHook` or `store.set` returns. Await this
 * before asserting to keep that render inside `act()`.
 */
export async function flushPendingAtomUpdates() {
  await act(async () => {});
}
