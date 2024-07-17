/*
 * Global test setup for all tests
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.stubEnv("DEV", true);
  vi.stubEnv("PROD", false);
});

beforeAll(() => {
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
});
