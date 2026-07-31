/*
 * Shared inputs the per-language fragment tests are held to. Only the inputs
 * (and the set of string-literal case names) are shared; each language declares
 * its own expected output, so a divergence stays visible in that language's
 * test file rather than hidden behind a shared runner.
 */

/**
 * Inputs fed to every language's `fragment.string`. This object is the single
 * source of truth for both the input values and the set of case names: each
 * language supplies an expected literal for each case, keyed by these names via
 * `satisfies Record<StringLiteralCase, string>`, so omitting a case or adding
 * one a language invents fails to compile.
 */
export const stringLiteralInputs = {
  plainValue: "test",
  surroundingWhitespace: " te st ",
  emptyString: "",
  backslash: "te\\st",
  controlCharacter: "a\nb",
  singleQuote: "te'st",
  doubleQuote: 'te"st',
} as const;

export type StringLiteralCase = keyof typeof stringLiteralInputs;

/**
 * A broad set of awkward inputs each language round-trips through its own
 * literal decoder, to prove escaping actually reverses on inputs the curated
 * per-case tables do not enumerate — unicode, embedded delimiters, and strings
 * resembling query syntax.
 */
export const awkwardStrings = [
  "",
  " leading and trailing ",
  'has a " double quote',
  "has a ' single quote",
  "has a \\ backslash",
  "has a ` backtick",
  "has <angle> brackets",
  "has {curly} braces",
  "has a | pipe and ^ caret",
  "has a newline\nin it",
  "has a tab\tin it",
  'backslash before a double quote a\\"b',
  "backslash before a single quote a\\'b",
  "café — naïve — 日本語",
  '") DROP; //',
  "MATCH (n) DETACH DELETE n",
] as const;
