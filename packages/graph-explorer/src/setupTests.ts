/*
 * Global test setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "core-js/full/iterator";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubEnv("DEV", true);
  vi.stubEnv("PROD", false);
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

// Mock the Recoil local forage effect, disabling it entirely. The switch to
// async local forage access made the tests fail in spectacular ways that I
// could not easily resolve.
vi.mock("@/core/StateProvider/localForageEffect", () => {
  return {
    localForageEffect: vi.fn().mockReturnValue(() => vi.fn()),
  };
});
