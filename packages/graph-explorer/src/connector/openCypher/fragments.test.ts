import { createEdgeId, createVertexId } from "@/core";
import { typedEntries } from "@/utils";

import { InvalidFragmentValueError } from "../queryFragment";
import {
  awkwardStrings,
  type StringLiteralCase,
  stringLiteralInputs,
} from "../testUtils/fragmentInputs";
import { fragment } from "./fragments";

function hasControlChar(value: string): boolean {
  for (const char of value) {
    if (char < " ") {
      return true;
    }
  }
  return false;
}

describe("fragment.string", () => {
  // openCypher literals are double-quoted with JSON escapes: `"` and `\` are
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

describe("fragment.identifier", () => {
  it("should wrap the name in backticks", () => {
    expect(fragment.identifier("airport")).toEqual("`airport`");
  });

  it("should preserve spaces in the name", () => {
    expect(fragment.identifier("home airport")).toEqual("`home airport`");
  });

  it("should double an embedded backtick", () => {
    expect(fragment.identifier("ai`rport")).toEqual("`ai``rport`");
  });

  it("should report an empty name as unrepresentable", () => {
    expect(() => fragment.identifier("")).toThrow(
      InvalidFragmentValueError.emptyIdentifier("openCypher", "identifier"),
    );
  });

  // A backtick-quoted name is the one fragment that can carry raw whitespace
  // into query text, and the `query` tag strips trailing whitespace and blank
  // lines from the assembled query — so a control character would silently
  // rewrite the name and address a different attribute.
  it.each(["home\nairport", "trailing \nx", "tab\tseparated", "nul\0byte"])(
    "should report %j, whose control character the query tag would rewrite",
    name => {
      expect(() => fragment.identifier(name)).toThrow(
        InvalidFragmentValueError.forbiddenCharacters(
          "openCypher",
          "identifier",
          name,
        ),
      );
    },
  );

  it("should keep a plain space, which the delimiters make safe", () => {
    expect(fragment.identifier("home airport")).toEqual("`home airport`");
  });

  // Control-character inputs are reported rather than emitted (above), so the
  // round-trip covers the rest of the corpus.
  it.each(awkwardStrings.filter(v => v !== "" && !hasControlChar(v)))(
    "round-trips a non-empty name %j",
    value => {
      const result = fragment.identifier(value);
      expect(result.startsWith("`")).toBe(true);
      expect(result.endsWith("`")).toBe(true);
      // An embedded backtick is doubled; undoubling the body recovers the name.
      expect(result.slice(1, -1).replaceAll("``", "`")).toBe(value);
    },
  );
});

describe("fragment.id", () => {
  it("should wrap a string ID in double quotes", () => {
    expect(fragment.id(createVertexId("124"))).toEqual('"124"');
  });

  it("should accept an edge ID", () => {
    expect(fragment.id(createEdgeId("e1"))).toEqual('"e1"');
  });

  it("should throw for a numeric ID, which openCypher does not support", () => {
    expect(() => fragment.id(createVertexId(124))).toThrow(
      InvalidFragmentValueError.unsupportedType("openCypher", "id", 124),
    );
  });

  it("should escape a double quote in a string ID", () => {
    expect(fragment.id(createVertexId('1"2'))).toEqual('"1\\"2"');
  });

  it("should escape a backslash in a string ID", () => {
    expect(fragment.id(createVertexId("1\\2"))).toEqual('"1\\\\2"');
  });

  it.each(awkwardStrings.filter(v => v !== ""))(
    "round-trips a string ID %j",
    value => {
      expect(JSON.parse(fragment.id(createVertexId(value)))).toBe(value);
    },
  );
});
