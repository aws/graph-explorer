/*
 * Global Jest setup for all tests
 */

// Mock the env module
jest.mock("../env", () => {
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
