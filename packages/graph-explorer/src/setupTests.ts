/*
 * Global test setup for all tests
 */

import "fake-indexeddb/auto";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { createStore } from "jotai";
import localforage from "localforage";
import { afterEach, expect, vi } from "vitest";

expect.extend(matchers);

// Mock getAppStore to return a specific test store
let store = createStore();
vi.mock(import("@/core/StateProvider/appStore"), () => {
  return {
    getAppStore: () => store,
  };
});

afterEach(() => {
  cleanup();
});

beforeEach(async () => {
  store = createStore();
  vi.stubEnv("DEV", true);
  vi.stubEnv("PROD", false);

  // Give each test a fresh IndexedDB so persisted state never bleeds between
  // tests. The vitest thread pool reuses workers, so the database must be
  // swapped out rather than relying on process isolation.
  //
  // The reset has to happen in this exact order: localForage caches its open
  // database handle keyed by name, so simply swapping `indexedDB` would leave
  // that stale handle pointing at the previous test's data. `dropInstance()`
  // deletes the database and clears the cached handle, the new `IDBFactory`
  // gives a clean backing store, and `ready()` re-opens against it.
  await localforage.dropInstance();
  globalThis.indexedDB = new IDBFactory();
  await localforage.ready();
});

// Mock sonner toast notifications to prevent requestAnimationFrame errors
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    custom: vi.fn(),
    promise: vi.fn((promise: Promise<unknown>) => promise),
  },
  Toaster: () => null,
}));

// Mock the internal createQueryClient to disable retries
// Use the actual implementation, but turn off retries in the default options.
vi.mock(import("./core/queryClient"), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    createQueryClient: () => {
      const client = original.createQueryClient();
      const defaultOptions = client.getDefaultOptions();
      client.setDefaultOptions({
        ...defaultOptions,
        queries: {
          ...defaultOptions.queries,
          retry: false,
        },
        mutations: {
          ...defaultOptions.mutations,
          retry: false,
        },
      });
      return client;
    },
  };
});

// Mock logger
vi.mock("@/utils/logger", () => ({
  default: {
    debug: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  setDiagnosticLogging: vi.fn(),
}));

// Mock Monaco editor to prevent script injection errors in tests
vi.mock("@monaco-editor/react", () => ({
  Editor: () => null,
  loader: {
    init: () => Promise.resolve({ editor: { defineTheme: vi.fn() } }),
    config: vi.fn(),
  },
}));
