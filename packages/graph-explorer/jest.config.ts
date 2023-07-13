import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testRegex: '.test.ts$',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
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
  collectCoverageFrom: [
    "src/**/*.{js,ts}", // specify the files to collect coverage from
  ],
  coverageReporters: ["json", "lcov", "text", "clover"], // lcov is required by Codecov
  "reporters": [
    "default",
    "jest-github-actions-reporter"
  ],
};

export default config;