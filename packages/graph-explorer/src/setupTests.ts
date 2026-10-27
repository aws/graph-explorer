/*
 * Global test setup for all tests
 */

import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createStore } from "jotai";
import localforage from "localforage";
import { afterEach, beforeEach, vi } from "vite-plus/test";

import { iconRegistry } from "@/core/icons/iconRegistry";
import { seedPersistedAtomsWithDefaults } from "@/core/StateProvider/persistedAtomRegistry";

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

  // The icon registry is a module singleton, so resolved icons would otherwise
  // bleed between tests.
  iconRegistry.reset();

  // Give each test an empty localForage store, since the vitest thread pool
  // reuses workers. `dropInstance()` drops the configured object store;
  // swapping `globalThis.indexedDB` wouldn't help because localForage captures
  // the factory at import.
  await localforage.dropInstance();

  // Every test starts from an empty database, so persisted atoms start at
  // their defaults. A test that seeds storage calls loadPersistedState().
  seedPersistedAtomsWithDefaults();
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
