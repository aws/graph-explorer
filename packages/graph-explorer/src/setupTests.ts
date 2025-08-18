/*
 * Global test setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "core-js/full/iterator";
import localforage from "localforage";

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

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubEnv("DEV", true);
  vi.stubEnv("PROD", false);
  localforage.clear();
});

// Mock the internal createQueryClient to disable retries
// Use the actual implementation, but turn off retries in the default options.
vi.mock("@/core/queryClient", async importOriginal => {
  const original = await importOriginal<typeof import("@/core/queryClient")>();
  return {
    ...original,
    createDefaultOptions: (explorer: any) => {
      const defaultOptions = original.createDefaultOptions(explorer);
      return {
        ...defaultOptions,
        queries: {
          ...defaultOptions.queries,
          retry: false,
        },
        mutations: {
          ...defaultOptions.mutations,
          retry: false,
        },
      };
    },
    createQueryClient: ({ explorer }: { explorer: any }) => {
      const client = original.createQueryClient({ explorer });
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
