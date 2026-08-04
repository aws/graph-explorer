import { createEdgeId, createVertexId } from "@/core";

import { UnrepresentableNumberError } from "../queryValueError";
import { ESCAPABLE_PATTERN, fragment, SHORT_ESCAPES } from "./fragments";

/**
 * Decodes a Gremlin single-quoted string literal back to its value, reversing
 * the seven escape sequences the escaper emits.
 */
function parseGremlinLiteral(literal: string): string {
  return literal.slice(1, -1).replace(/\\(.)/g, (_, escaped: string) => {
    switch (escaped) {
      case "b":
        return "\b";
      case "t":
        return "\t";
      case "n":
        return "\n";
      case "f":
        return "\f";
      case "r":
        return "\r";
      default:
        return escaped;
    }
  });
}

/**
 * A literal whose body contains no bare delimiter and no escape outside the set
 * the escaper emits. Asserted alongside each round trip because the decoder
 * alone is tolerant: it maps an unescaped `\'` and a lone trailing `\\` back to
 * themselves, so decoding would still succeed if the escaper stopped escaping.
 */
const WELL_FORMED_LITERAL = /^'(?:[^'\\]|\\[btnfr\\'])*'$/;

/**
 * Asserts the literal is well formed and decodes back to the original value.
 */
function expectRoundTrip(literal: string, value: string) {
  expect(literal).toMatch(WELL_FORMED_LITERAL);
  expect(parseGremlinLiteral(literal)).toBe(value);
}

/**
 * Inputs every constructor is round-tripped over: embedded delimiters,
 * backslashes, control characters, unicode, and strings resembling query syntax
 * — the cases the curated exact-literal table does not enumerate.
 */
const awkwardStrings = [
  "",
  " leading and trailing ",
  'has a " double quote',
  "has a ' single quote",
  "has a \\ backslash",
  "has a ` backtick",
  "has <angle> brackets",
  "has a newline\nin it",
  "has a tab\tin it",
  "has a carriage\rreturn",
  `has a ${String.fromCharCode(0x08)} backspace`,
  `has a ${String.fromCharCode(0x0c)} form feed`,
  `has a ${String.fromCharCode(0x01)} control character`,
  `has a ${String.fromCharCode(0x0b)} vertical tab`,
  "backslash before a single quote a\\'b",
  "two backslashes before a quote a\\\\'b",
  "trailing backslash\\",
  "\\",
  "café — naïve — 日本語",
  "emoji 😀 here",
  `line ${String.fromCharCode(0x2028)} separator`,
  `delete ${String.fromCharCode(0x7f)} character`,
  `nbsp ${String.fromCharCode(0x00a0)} character`,
  "\ud800",
  "cost is $total",
] as const;

describe("the escape table and its match pattern", () => {
  it("should hold a single UTF-16 code unit per key, which is all the pattern can express", () => {
    expect(
      Object.keys(SHORT_ESCAPES).filter(char => char.length !== 1),
    ).toEqual([]);
  });

  it("should match every character the table escapes, and no others", () => {
    // `matchAll` rather than `test`, which advances `lastIndex` on a global regex.
    const matched: string[] = [];
    for (let code = 0; code < 0x110000; code++) {
      const char = String.fromCodePoint(code);
      if ([...char.matchAll(ESCAPABLE_PATTERN)].length > 0) {
        matched.push(char);
      }
    }
    expect(matched.toSorted()).toEqual(Object.keys(SHORT_ESCAPES).toSorted());
  });
});

describe("fragment.string", () => {
  // Single-quoted: `'` and `\` are escaped and control characters take their
  // short escapes, so `"` and `$` are the characters left bare.
  const cases: [input: string, literal: string][] = [
    ["test", "'test'"],
    [" te st ", "' te st '"],
    ["", "''"],
    ["te\\st", "'te\\\\st'"],
    ["te'st", "'te\\'st'"],
    ['te"st', `'te"st'`],
    ["a\bb", "'a\\bb'"],
    ["a\tb", "'a\\tb'"],
    ["a\nb", "'a\\nb'"],
    ["a\fb", "'a\\fb'"],
    ["a\rb", "'a\\rb'"],
  ];

  it.each(cases)("encodes %j", (value, literal) => {
    expect(fragment.string(value)).toBe(literal);
  });

  it("should leave a dollar sign alone, since escaping it breaks the query on Neptune", () => {
    expect(fragment.string("cost is $total")).toBe("'cost is $total'");
  });

  it("should emit a control character without a short escape raw, never as \\uXXXX", () => {
    expect(fragment.string(`a${String.fromCharCode(0x01)}b`)).toBe(
      `'a${String.fromCharCode(0x01)}b'`,
    );
    expect(fragment.string(`a${String.fromCharCode(0x0b)}b`)).toBe(
      `'a${String.fromCharCode(0x0b)}b'`,
    );
  });

  it.each(awkwardStrings)("round-trips %j", value => {
    expectRoundTrip(fragment.string(value), value);
  });
});

describe("fragment.identifier", () => {
  it("should wrap the name in single quotes", () => {
    expect(fragment.identifier("city")).toEqual("'city'");
  });

  it("should preserve spaces in the name", () => {
    expect(fragment.identifier("home city")).toEqual("'home city'");
  });

  it("should escape a single quote", () => {
    expect(fragment.identifier("ci'ty")).toEqual("'ci\\'ty'");
  });

  it("should escape a backslash", () => {
    expect(fragment.identifier("ci\\ty")).toEqual("'ci\\\\ty'");
  });

  it("should leave a dollar sign alone", () => {
    expect(fragment.identifier("wei$rd")).toEqual("'wei$rd'");
  });

  it.each(awkwardStrings)("round-trips a name %j", value => {
    expectRoundTrip(fragment.identifier(value), value);
  });

  // Gremlin takes a property key or label as an ordinary string literal, so
  // `identifier` and `string` coincide. Nothing in a generated query reveals
  // which one a call site chose; if the two ever diverge, every call site's
  // choice has to be re-checked rather than assumed.
  it.each(awkwardStrings)(
    "should render %j identically to a string literal",
    value => {
      expect(fragment.identifier(value)).toBe(fragment.string(value));
    },
  );
});

describe("fragment.number", () => {
  // `%s` rather than `%j`, which renders NaN and the infinities as `null`.
  it.each([
    [0, "0"],
    [100, "100"],
    [-5, "-5"],
    [1.5, "1.5"],
    [-1.5, "-1.5"],
    [0.000001, "0.000001"],
    [Number.MAX_SAFE_INTEGER, "9007199254740991"],
    // Large enough to lose precision, but still written out in full, so the
    // parser reads it as a number.
    [1e20, "100000000000000000000"],
  ])("should emit %s without delimiters", (value, text) => {
    expect(fragment.number(value)).toBe(text);
  });

  it.each([NaN, Infinity, -Infinity, 1e21, -1e21, 1e-7, Number.MIN_VALUE])(
    "should reject %s, which has no plain decimal form",
    value => {
      expect(() => fragment.number(value)).toThrow(
        new UnrepresentableNumberError(value),
      );
    },
  );
});

describe("fragment.id", () => {
  it("should wrap a string ID in single quotes", () => {
    expect(fragment.id(createVertexId("124"))).toEqual("'124'");
  });

  it("should accept an edge ID", () => {
    expect(fragment.id(createEdgeId("e1"))).toEqual("'e1'");
  });

  it("should add the long suffix to a numeric ID", () => {
    expect(fragment.id(createVertexId(124))).toEqual("124L");
  });

  it("should escape a single quote in a string ID", () => {
    expect(fragment.id(createVertexId("1'2"))).toEqual("'1\\'2'");
  });

  it("should escape a backslash in a string ID", () => {
    expect(fragment.id(createVertexId("1\\2"))).toEqual("'1\\\\2'");
  });

  it.each(awkwardStrings)("round-trips a string ID %j", value => {
    expectRoundTrip(fragment.id(createVertexId(value)), value);
  });
});
