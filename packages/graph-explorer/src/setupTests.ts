/*
 * Global Jest setup for all tests
 */

// Sets up `fetch` for JSDom environment.
// https://github.com/jsdom/jsdom/issues/1724#issuecomment-720727999
import "whatwg-fetch";

// Sets up extra expectations for Jest to work with React
import "@testing-library/jest-dom/extend-expect";

// Mock the env module
jest.mock("./utils/env", () => {
  return {
    env: {
      DEV: true,
      PROD: false,
    },
  };
});

// Mock localforage
jest.mock("localforage", () => ({
  config: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
