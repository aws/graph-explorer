import type { Config } from "jest";

const config: Config = {
  displayName: 'graph-explorer',
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
    'json'
  ],
  rootDir: 'src',
  testRegex: '.test.ts$',
  transformIgnorePatterns: [
    "node_modules/(?!(swiper|dom7)/)",
    "node_modules/(?!(react-dnd-html5-backend)/)"
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/packages/$1/src',
  },
  coverageDirectory: '../coverage',
  collectCoverage: true, // collect coverage info
  coverageReporters: [
    "lcov",
    "text",
    "json",
    "clover"
  ],
  collectCoverageFrom: [  // collect and exclude files from coverage
    "**/*.{ts,tsx}",
    "!**/*.styles.ts",
  ],
  coveragePathIgnorePatterns: [
    "src/components/icons", // exclude icons from coverage
    "src/@types",
    "src/index.tsx",
    "src/App.ts",
    "src/setupTests.ts",
  ],
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      branches: 31,
      functions: 14,
      lines: 8,
      statements: -0,
    },
  },
};

export default config;
