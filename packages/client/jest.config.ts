import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "jsdom",
};

export default config;
