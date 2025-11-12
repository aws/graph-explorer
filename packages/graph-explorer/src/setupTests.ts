/*
 * Global test setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "core-js/full/iterator";
import localforage from "localforage";
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
  localforage.clear();
  vi.clearAllMocks();
  vi.resetModules();
  vi.resetAllMocks();
  vi.restoreAllMocks();
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

// Mock localforage
vi.mock("localforage", () => {
  const store = new Map<string, any>();

  return {
    default: {
      config: vi.fn(),
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key))),
      setItem: vi.fn((key: string, value: any) => {
        store.set(key, value);
        return Promise.resolve(value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
    },
  };
});
