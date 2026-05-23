import { describe, expect, test } from "vitest";

import { createQueryClient } from "./queryClient";
import { getAppStore } from "./StateProvider/appStore";

describe("createQueryClient", () => {
  test("should inject the Jotai store into query and mutation meta", () => {
    const store = getAppStore();
    const queryClient = createQueryClient();

    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.meta?.store).toBe(store);
    expect(defaultOptions.mutations?.meta?.store).toBe(store);
  });

  test("should disable refetch on window focus", () => {
    const queryClient = createQueryClient();

    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  test("should set a 5 minute stale time", () => {
    const queryClient = createQueryClient();

    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
  });
});
