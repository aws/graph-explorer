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
    "!**/node_modules/**",
    "!**/jest.config.js",
    "!**/coverage/**",
    "!**/reports/**",
    "!**/*.styles.ts",
    "!**/index.tsx",
    "!**/*.types.ts",
    "!/src/@types/**",
  ],
  coveragePathIgnorePatterns: [
    // These files have not been tested and will cause the coverage report to be incomplete.
    '/src/components/utils/canvas/drawImage.ts',
    '/src/components/Graph/hooks/useRenderBadges.ts',
    '/src/modules/KeywordSearch/toAdvancedList.ts',
    '/src/connector/gremlin/GremlinConnector.ts',
    '/src/connector/sparql/SPARQLConnector.ts',
    '/src/core/ConfigurationProvider/fetchConfiguration.ts',
    '/src/core/ConfigurationProvider/isConfiguration.ts',
    '/src/core/ConnectorProvider/useConnector.ts',
    '/src/core/StateProvider/StateProvider.tsx',
    '/src/hooks/useSchemaSync.ts',
    '/src/index.tsx',
    '/src/@types',
    'src/components/Graph/styles',
    // These files have not been tested and will cause the coverage report to be incomplete.
  ],
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      branches: 31,
      functions: 14,
      lines: 9,
      statements: -0,
    },
  },
};

export default config;
