/*
 * Global test setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "core-js/full/iterator";
import { createStore } from "jotai";
import type { Explorer } from "./connector";
import type { Store } from "jotai/vanilla/store";
import { getAppStore } from "./core";

expect.extend(matchers);

// Set the test environment timezone & locale so it is consistent across machines
const defaultLocale = "en-US";
process.env.TZ = "UTC";
process.env.LC_ALL = `${defaultLocale}.UTF-8`;
process.env.LANG = `${defaultLocale}.UTF-8`;
process.env.LANGUAGE = defaultLocale;

// Also mock Intl to ensure consistency
const originalIntl = global.Intl;

vi.stubGlobal("Intl", {
  ...originalIntl,
  NumberFormat: function (locale = defaultLocale, options) {
    return new originalIntl.NumberFormat(locale, options);
  } as typeof originalIntl.NumberFormat,
  DateTimeFormat: function (locale = defaultLocale, options) {
    return new originalIntl.DateTimeFormat(locale, options);
  } as typeof originalIntl.DateTimeFormat,
});

// Mock getAppStore to return a specific test store
let store = createStore();
vi.mock(import("@/core/StateProvider/appStore"), () => {
  return {
    getAppStore: () => store,
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  store = createStore();
  vi.stubEnv("DEV", true);
  vi.stubEnv("PROD", false);
  vi.clearAllMocks();
  vi.resetModules();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// Mock the NotificationProvider
vi.mock(import("@/components/NotificationProvider"), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useNotification: () => ({
      enqueueNotification: vi.fn(() => "notification-id"),
      clearNotification: vi.fn(),
    }),
  };
});

// Mock the internal createQueryClient to disable retries
// Use the actual implementation, but turn off retries in the default options.
vi.mock(import("./core/queryClient"), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    createQueryClient: ({
      explorer,
      store = getAppStore(),
    }: {
      explorer: Explorer;
      store?: Store;
    }) => {
      const client = original.createQueryClient({ explorer, store });
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
}));

// Mock Monaco editor to prevent script injection errors in tests
vi.mock("@monaco-editor/react", () => ({
  Editor: () => null,
  loader: {
    init: () => Promise.resolve({ editor: { defineTheme: vi.fn() } }),
    config: vi.fn(),
  },
}));

// Stub out localforage using map
let localForageStore: Map<string, any> = new Map();
vi.mock(import("localforage"), () => {
  return {
    default: {
      config: vi.fn(),
      async getItem(key: string) {
        await Promise.resolve();
        return localForageStore.has(key) ? localForageStore.get(key) : null;
      },
      async setItem(key: string, value: any) {
        await Promise.resolve();
        localForageStore.set(key, value);
        return value;
      },
      async removeItem(key: string) {
        await Promise.resolve();
        localForageStore.delete(key);
      },
      async clear() {
        await Promise.resolve();
        localForageStore.clear();
      },

      // Other functions that we don't use
      LOCALSTORAGE: "",
      WEBSQL: "",
      INDEXEDDB: "",
      createInstance: vi.fn(),
      driver: vi.fn(),
      setDriver: vi.fn(),
      defineDriver: vi.fn(),
      getDriver: vi.fn(),
      getSerializer: vi.fn(),
      supports: vi.fn(),
      ready: vi.fn(),
      length: vi.fn(),
      key: vi.fn(),
      keys: vi.fn(),
      iterate: vi.fn(),
      dropInstance: vi.fn(),
    } satisfies LocalForage,
  };
});

beforeEach(() => {
  localForageStore.clear();
  localForageStore = new Map();
});
