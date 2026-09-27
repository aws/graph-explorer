import { describe, expect, test } from "vitest";

import {
  InsecureDatabaseUrlError,
  InvalidDatabaseUrlError,
  MissingDatabaseUrlError,
} from "@/utils";

import { createQueryClient, shouldRetryQuery } from "./queryClient";
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

  test("should retry an ordinary failure", () => {
    expect(shouldRetryQuery(0, new Error("Something failed"))).toBe(true);
  });

  // Thrown before any request, so a retry can only fail the same way
  test("should not retry a connection with no database URL", () => {
    expect(shouldRetryQuery(0, new MissingDatabaseUrlError())).toBe(false);
  });

  test("should not retry a direct connection with an invalid database URL", () => {
    expect(shouldRetryQuery(0, new InvalidDatabaseUrlError("/neptune"))).toBe(
      false,
    );
  });

  test("should not retry a direct connection with an insecure database URL", () => {
    expect(
      shouldRetryQuery(0, new InsecureDatabaseUrlError("http://db:8182")),
    ).toBe(false);
  });
});
