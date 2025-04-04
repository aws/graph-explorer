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
  return {
    default: {
      config: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
    },
  };
});
