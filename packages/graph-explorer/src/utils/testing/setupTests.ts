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
