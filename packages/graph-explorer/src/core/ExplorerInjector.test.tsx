import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { Provider } from "jotai";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockExplorer } from "@/utils/testing";

import { explorerForTestingAtom } from "./connector";
import { ExplorerInjector } from "./ExplorerInjector";
import { getAppStore } from "./StateProvider/appStore";

function renderExplorerInjector(queryClient: QueryClient) {
  const store = getAppStore();
  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ExplorerInjector />
      </Provider>
    </QueryClientProvider>,
  );
}

describe("ExplorerInjector", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  test("should render null", () => {
    const { container } = renderExplorerInjector(queryClient);
    expect(container.firstChild).toBeNull();
  });

  test("should set default options on query client", () => {
    const store = getAppStore();
    const explorer = createMockExplorer();
    store.set(explorerForTestingAtom, explorer);

    renderExplorerInjector(queryClient);

    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.meta?.explorer).toBe(explorer);
    expect(defaultOptions.queries?.meta?.store).toBe(store);
    expect(defaultOptions.mutations?.meta?.explorer).toBe(explorer);
    expect(defaultOptions.mutations?.meta?.store).toBe(store);
  });

  test("should clear cache when explorer changes", () => {
    const store = getAppStore();
    const explorer1 = createMockExplorer();
    store.set(explorerForTestingAtom, explorer1);

    const clearSpy = vi.spyOn(queryClient, "clear");
    const setDefaultOptionsSpy = vi.spyOn(queryClient, "setDefaultOptions");

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ExplorerInjector />
        </Provider>
      </QueryClientProvider>,
    );

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(setDefaultOptionsSpy).toHaveBeenCalledTimes(1);

    // Change the explorer
    const explorer2 = createMockExplorer();
    act(() => {
      store.set(explorerForTestingAtom, explorer2);
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ExplorerInjector />
        </Provider>
      </QueryClientProvider>,
    );

    expect(clearSpy).toHaveBeenCalledTimes(2);
    expect(setDefaultOptionsSpy).toHaveBeenCalledTimes(2);

    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.meta?.explorer).toBe(explorer2);
  });

  test("should not clear cache when explorer remains the same", () => {
    const store = getAppStore();
    const explorer = createMockExplorer();
    store.set(explorerForTestingAtom, explorer);

    const clearSpy = vi.spyOn(queryClient, "clear");

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ExplorerInjector />
        </Provider>
      </QueryClientProvider>,
    );

    expect(clearSpy).toHaveBeenCalledTimes(1);

    // Rerender without changing explorer
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ExplorerInjector />
        </Provider>
      </QueryClientProvider>,
    );

    // Should still be 1 since explorer didn't change
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
