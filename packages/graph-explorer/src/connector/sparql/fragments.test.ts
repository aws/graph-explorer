import { createEdgeId, createVertexId } from "@/core";
import { typedEntries } from "@/utils";

import { InvalidFragmentValueError } from "../queryFragment";
import {
  awkwardStrings,
  type StringLiteralCase,
  stringLiteralInputs,
} from "../testUtils/fragmentInputs";
import { fragment } from "./fragments";

/**
 * Characters the SPARQL IRIREF grammar forbids between the angle brackets,
 * listed explicitly here rather than imported from the constructor. Kept
 * independent on purpose: if the constructor's set drifts from the grammar,
 * these cases still assert the grammar's rule and catch the divergence. The
 * space and tab stand in for the whole U+0000–U+0020 control range.
 */
const forbiddenIriChars = [
  "<",
  ">",
  '"',
  "{",
  "}",
  "|",
  "^",
  "`",
  "\\",
  // The U+0000–U+0020 control range, including its boundaries: NUL, tab,
  // newline, carriage return, U+001F, and the space itself.
  "\0",
  "\t",
  "\n",
  "\r",
  "\u001f",
  " ",
] as const;

/** A representative IRI value embedding each forbidden character. */
const forbiddenIriInputs = forbiddenIriChars.map(
  char => `http://example.com/a${char}b`,
);

describe("fragment.string", () => {
  // SPARQL literals are double-quoted with JSON escapes: `"` and `\` are
  // escaped, `'` is left bare.
  const expected = {
    plainValue: '"test"',
    surroundingWhitespace: '" te st "',
    emptyString: '""',
    backslash: '"te\\\\st"',
    controlCharacter: '"a\\nb"',
    singleQuote: `"te'st"`,
    doubleQuote: '"te\\"st"',
  } satisfies Record<StringLiteralCase, string>;

  it.each(typedEntries(expected))("encodes %s", (name, literal) => {
    expect(fragment.string(stringLiteralInputs[name])).toBe(literal);
  });

  it.each(awkwardStrings)("round-trips %j", value => {
    expect(JSON.parse(fragment.string(value))).toBe(value);
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
      InvalidFragmentValueError.unsupportedType("sparql", "IRI", 124),
    );
  });

  it.each(forbiddenIriInputs)("should report %j as unrepresentable", value => {
    expect(() => fragment.iri(value)).toThrow(
      InvalidFragmentValueError.forbiddenCharacters("sparql", "IRI", value),
    );
  });

  it("should accept the character just past the control range", () => {
    // U+0021 is the first code point the grammar permits, so it pins the
    // boundary of the control-range check rather than leaving it one-sided.
    expect(fragment.iri("http://example.com/a!b")).toBe(
      "<http://example.com/a!b>",
    );
  });

  // The shared awkward-input corpus, partitioned up front so each assertion is
  // unconditional: a value using only permitted characters must bracket, one
  // with any forbidden character must be reported — the constructor never emits
  // an unrepresentable value.
  const forbiddenSet = new Set<string>(forbiddenIriChars);
  function isRepresentableIri(value: string): boolean {
    for (const char of value) {
      if (char <= " " || forbiddenSet.has(char)) {
        return false;
      }
    }
    return true;
  }
  const representable = awkwardStrings.filter(isRepresentableIri);
  const unrepresentable = awkwardStrings.filter(v => !isRepresentableIri(v));

  it.each(representable)("brackets %j", value => {
    expect(fragment.iri(value)).toBe(`<${value}>`);
  });

  it.each(unrepresentable)("reports %j", value => {
    expect(() => fragment.iri(value)).toThrow(InvalidFragmentValueError);
  });
});
