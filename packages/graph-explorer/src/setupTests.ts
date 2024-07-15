/*
 * Global Jest setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock the env module
vi.mock("./utils/env", () => {
  return {
    env: {
      DEV: true,
      PROD: false,
    },
  };
});

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
