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
 * Decodes a Gremlin single-quoted string literal back to its value. Gremlin
 * literals are single-quoted (Groovy interpolates `$` in double quotes), which
 * is not valid JSON, so convert to the equivalent double-quoted JSON literal —
 * unescape `\'` to `'`, escape any bare `"`, swap the delimiters — then parse.
 */
function parseGremlinLiteral(literal: string): string {
  const body = literal
    .slice(1, -1)
    .replaceAll("\\'", "'")
    .replaceAll('"', '\\"');
  return JSON.parse(`"${body}"`) as string;
}

describe("fragment.string", () => {
  // Gremlin literals are single-quoted: `'` is escaped, `"` and `$` are left
  // bare (a single-quoted Groovy string does not interpolate).
  const expected = {
    plainValue: "'test'",
    surroundingWhitespace: "' te st '",
    emptyString: "''",
    backslash: "'te\\\\st'",
    controlCharacter: "'a\\nb'",
    singleQuote: "'te\\'st'",
    doubleQuote: `'te"st'`,
  } satisfies Record<StringLiteralCase, string>;

  it.each(typedEntries(expected))("encodes %s", (name, literal) => {
    expect(fragment.string(stringLiteralInputs[name])).toBe(literal);
  });

  it("should leave a dollar sign alone, so a Groovy engine does not interpolate it", () => {
    expect(fragment.string("cost is $total")).toBe("'cost is $total'");
    expect(fragment.string("has ${1 + 1} braces")).toBe(
      "'has ${1 + 1} braces'",
    );
  });

  it.each(awkwardStrings)("round-trips %j", value => {
    expect(parseGremlinLiteral(fragment.string(value))).toBe(value);
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

  it("should report an empty name as unrepresentable", () => {
    expect(() => fragment.identifier("")).toThrow(
      InvalidFragmentValueError.emptyIdentifier("gremlin", "identifier"),
    );
  });

  it.each(awkwardStrings.filter(v => v !== ""))(
    "round-trips a non-empty name %j",
    value => {
      expect(parseGremlinLiteral(fragment.identifier(value))).toBe(value);
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

  it.each(awkwardStrings.filter(v => v !== ""))(
    "round-trips a string ID %j",
    value => {
      expect(parseGremlinLiteral(fragment.id(createVertexId(value)))).toBe(
        value,
      );
    },
  );
});
