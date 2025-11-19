import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import type { PropsWithChildren } from "react";
import { DbState } from "./DbState";
import { createQueryClient } from "@/core/queryClient";
import { getAppStore, type AppStore } from "@/core";

export function TestProvider({
  store,
  client,
  children,
}: PropsWithChildren<{ store: AppStore; client: QueryClient }>) {
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>{children}</Provider>
    </QueryClientProvider>
  );
}

export function renderHookWithState<TResult>(
  callback: () => TResult,
  state?: DbState,
) {
  // Create default DbState if none passed
  state ??= new DbState();

  // Set values on the Jotai store
  const store = getAppStore();
  state.applyTo(store);

  // Create the query client using the mock explorer
  const queryClient = createQueryClient({ explorer: state.explorer, store });
  const defaultOptions = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaultOptions,
    queries: { ...defaultOptions.queries, retry: false },
  });

  // Call the standard testing hook with TanStack Query and Jotai setup
  return renderHook(callback, {
    wrapper: props => (
      <TestProvider client={queryClient} store={store} {...props} />
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
