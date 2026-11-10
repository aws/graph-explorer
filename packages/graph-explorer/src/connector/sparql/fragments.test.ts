import { describe, expect, it } from "vitest";

import { createEdgeId, createVertexId } from "@/core";

import {
  UnescapableValueError,
  UnrepresentableNumberError,
  UnrepresentableStringError,
  UnsupportedValueTypeError,
} from "../queryValueError";
import { ESCAPABLE_PATTERN, fragment, SHORT_ESCAPES } from "./fragments";

/**
 * Decodes a SPARQL double-quoted string literal back to its value, reversing
 * the escape sequences the escaper emits.
 */
function parseSparqlLiteral(literal: string): string {
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
 * alone is tolerant: it maps a lone trailing `\\` back to itself, so decoding
 * would still succeed if the escaper stopped escaping.
 */
const WELL_FORMED_LITERAL = /^"(?:[^"\\]|\\[btnfr\\"])*"$/;

/**
 * Asserts the literal is well formed and decodes back to the original value.
 */
function expectRoundTrip(literal: string, value: string) {
  expect(literal).toMatch(WELL_FORMED_LITERAL);
  expect(parseSparqlLiteral(literal)).toBe(value);
}

/**
 * Inputs the string constructor is round-tripped over: embedded delimiters,
 * backslashes, control characters, unicode, and strings resembling query syntax
 * — the cases the curated exact-literal table does not enumerate. Fed only to
 * `fragment.string`; several of these carry IRI-forbidden characters.
 */
const awkwardStrings = [
  "",
  " leading and trailing ",
  'has a " double quote',
  "has a ' single quote",
  "has a \\ backslash",
  "has a ` backtick",
  "has <angle> brackets",
  "has { curly } braces",
  "has a | pipe",
  "has a ^ caret",
  "has a newline\nin it",
  "has a tab\tin it",
  "has a carriage\rreturn",
  `has a ${String.fromCharCode(0x08)} backspace`,
  `has a ${String.fromCharCode(0x0c)} form feed`,
  `has a ${String.fromCharCode(0x01)} control character`,
  `has a ${String.fromCharCode(0x0b)} vertical tab`,
  'backslash before a quote a\\"b',
  'two backslashes before a quote a\\\\"b',
  "trailing backslash\\",
  "\\",
  "café — naïve — 日本語",
  "emoji 😀 here",
  `line ${String.fromCharCode(0x2028)} separator`,
  `delete ${String.fromCharCode(0x7f)} character`,
  `nbsp ${String.fromCharCode(0x00a0)} character`,
  'FILTER (?value = "x")',
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

describe("fragment.number", () => {
  // The database, not the fragment, reports a number its position refuses.
  it.each([
    [0, "0"],
    [25, "25"],
    [Number.MAX_SAFE_INTEGER, "9007199254740991"],
    [-5, "-5"],
    [1.5, "1.5"],
  ])("should emit %s as %s", (value, text) => {
    expect(fragment.number(value)).toEqual(text);
  });

  it.each([
    [Number.NaN, "not a number"],
    [Number.POSITIVE_INFINITY, "infinite"],
    [1e21, "exponential in text form"],
  ])("should reject %s, which is %s", value => {
    expect(() => fragment.number(value)).toThrow(
      new UnrepresentableNumberError(value),
    );
  });

  // The value is checked as emitted text, whatever its runtime type.
  it.each(["0x10", "1e3", " 5 ", "abc", "10 extra", "007"])(
    "should reject the runtime string %o",
    value => {
      expect(() => fragment.number(value as unknown as number)).toThrow(
        new UnrepresentableNumberError(value as unknown as number),
      );
    },
  );

  it("should emit a digits-only string", () => {
    expect(fragment.number("10" as unknown as number)).toEqual("10");
  });
});

describe("fragment.string", () => {
  // Double-quoted: `"` and `\` are escaped and control characters take their
  // short escapes, so `'` is the character left bare.
  const cases: [input: string, literal: string][] = [
    ["test", '"test"'],
    [" te st ", '" te st "'],
    ["", '""'],
    ["te\\st", '"te\\\\st"'],
    ['te"st', '"te\\"st"'],
    ["te'st", `"te'st"`],
    ["a\bb", '"a\\bb"'],
    ["a\tb", '"a\\tb"'],
    ["a\nb", '"a\\nb"'],
    ["a\fb", '"a\\fb"'],
    ["a\rb", '"a\\rb"'],
  ];

  it.each(cases)("encodes %j", (value, literal) => {
    expect(fragment.string(value)).toBe(literal);
  });

  it("should leave a single quote alone, since it needs no escaping", () => {
    expect(fragment.string("t'est")).toBe(`"t'est"`);
  });

  it("should emit a control character without a short escape raw, never as \\uXXXX", () => {
    expect(fragment.string(`a${String.fromCharCode(0x01)}b`)).toBe(
      `"a${String.fromCharCode(0x01)}b"`,
    );
    expect(fragment.string(`a${String.fromCharCode(0x0b)}b`)).toBe(
      `"a${String.fromCharCode(0x0b)}b"`,
    );
  });

  it.each(awkwardStrings)("round-trips %j", value => {
    expectRoundTrip(fragment.string(value), value);
  });

  it("should reject a lone surrogate, which no database can carry", () => {
    expect(() => fragment.string("\ud800")).toThrow(
      new UnrepresentableStringError("\ud800"),
    );
  });
});

describe("fragment.iri", () => {
  it("should wrap the value in angle brackets", () => {
    expect(fragment.iri("http://example.com/thing")).toEqual(
      "<http://example.com/thing>",
    );
  });

  it("should accept a vertex ID", () => {
    expect(fragment.iri(createVertexId("http://example.com/thing"))).toEqual(
      "<http://example.com/thing>",
    );
  });

  it("should accept an edge ID", () => {
    expect(fragment.iri(createEdgeId("http://example.com/e1"))).toEqual(
      "<http://example.com/e1>",
    );
  });

  it("should throw when the value is not a string, since an IRI is text", () => {
    expect(() => fragment.iri(createVertexId(124))).toThrow(
      new UnsupportedValueTypeError("sparql", "IRI", createVertexId(124)),
    );
  });

  it("should accept an IRI with allowed punctuation unchanged", () => {
    const iri = "http://example.com/a#b/c:d?e=f-g.h~i!j";
    expect(fragment.iri(iri)).toEqual(`<${iri}>`);
  });

  it("should accept U+0021, one past the control range", () => {
    expect(fragment.iri("http://example.com/a!b")).toEqual(
      "<http://example.com/a!b>",
    );
  });

  // Independent of the source's FORBIDDEN_IRI_CHARS, so an errant edit to that
  // set is caught rather than mirrored. Space and tab stand in for the
  // U+0000–U+0020 control range an IRI cannot carry.
  const forbiddenChars = [
    "<",
    ">",
    '"',
    "{",
    "}",
    "|",
    "^",
    "`",
    "\\",
    " ",
    "\t",
  ] as const;

  it.each(forbiddenChars)(
    "should reject an IRI carrying %j, which has no escape",
    char => {
      const value = `http://example.com/a${char}b`;
      expect(() => fragment.iri(value)).toThrow(
        new UnescapableValueError("sparql", "IRI", value, [char]),
      );
    },
  );
});
