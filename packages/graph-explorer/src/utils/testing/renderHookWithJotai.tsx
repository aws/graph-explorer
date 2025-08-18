import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Provider, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { ReactNode } from "react";
import { DbState } from "./DbState";
import { createQueryClient } from "@/core/queryClient";

type AnyWritableAtom = WritableAtom<unknown, unknown[], unknown>;

type HydrateAtomsProps<T extends Map<AnyWritableAtom, unknown>> = {
  initialValues: T;
  children: ReactNode;
};

function HydrateAtoms<T extends Map<AnyWritableAtom, unknown>>({
  initialValues,
  children,
}: HydrateAtomsProps<T>) {
  useHydrateAtoms(initialValues);
  return children;
}

export function TestProvider<T extends Map<AnyWritableAtom, unknown>>({
  initialValues,
  children,
}: HydrateAtomsProps<T>) {
  return (
    <Provider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </Provider>
  );
}

export interface JotaiSnapshot {
  set: <Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    value: Value
  ) => void;
  values: () => Map<AnyWritableAtom, unknown>;
}

export function createJotaiSnapshot(): JotaiSnapshot {
  const map = new Map<AnyWritableAtom, unknown>();
  return {
    set: (atom, value) => {
      map.set(atom as AnyWritableAtom, value);
    },
    values: () => map,
  };
}

export function renderHookWithState<TResult>(
  callback: () => TResult,
  state?: DbState
) {
  // Create default DbState if none passed
  state ??= new DbState();

  // Set values on the Jotai snapshot
  const snapshot = createJotaiSnapshot();
  state.applyTo(snapshot);

  // Create the query client using the mock explorer
  const queryClient = createQueryClient({ explorer: state.explorer });
  const defaultOptions = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaultOptions,
    queries: { ...defaultOptions.queries, retry: false },
  });

  // Call the standard testing hook with TanStack Query and Jotai setup
  return renderHook(callback, {
    wrapper: ({ children }) => {
      return (
        <QueryClientProvider client={queryClient}>
          <TestProvider initialValues={snapshot.values()}>
            {children}
          </TestProvider>
        </QueryClientProvider>
      );
    },
  });
}

export function renderHookWithJotai<TResult>(
  callback: () => TResult,
  initializeState?: (snapshot: JotaiSnapshot) => void
) {
  // Provide a way to set atom initial values
  const snapshot = createJotaiSnapshot();
  if (initializeState) {
    initializeState(snapshot);
  }

  // Call the standard testing hook with TanStack Query and Jotai setup
  const queryClient = new QueryClient();

  return renderHook(callback, {
    wrapper: ({ children }) => {
      return (
        <QueryClientProvider client={queryClient}>
          <TestProvider initialValues={snapshot.values()}>
            {children}
          </TestProvider>
        </QueryClientProvider>
      );
    },
  });
}
