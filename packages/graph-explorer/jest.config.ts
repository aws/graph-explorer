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
  coverageDirectory: '../coverage',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/packages/$1/src',
  },
  coverageReporters: ['text', 'lcov'],
};

export default config;