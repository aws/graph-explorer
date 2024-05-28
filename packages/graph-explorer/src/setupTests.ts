/*
 * Global Jest setup for all tests
 */

// Sets up `fetch` for JSDom environment.
// https://github.com/jsdom/jsdom/issues/1724#issuecomment-720727999
import "whatwg-fetch";

// Mock the env module
jest.mock("./utils/env", () => {
  return {
    DEV: true,
    PROD: false,
  };
});

// Mock localforage
jest.mock("localforage", () => ({
  config: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
