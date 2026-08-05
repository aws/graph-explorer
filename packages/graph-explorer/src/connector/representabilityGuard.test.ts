import fc from "fast-check";

import type { QueryFragment } from "./queryFragment";

import { fragment as gremlin } from "./gremlin/fragments";
import { fragment as openCypher } from "./openCypher/fragments";
import { QueryValueError } from "./queryValueError";
import { fragment as sparql } from "./sparql/fragments";

const modules = { openCypher, gremlin, sparql };

describe.each(Object.entries(modules))(
  "%s constructors reject unrepresentable values",
  (_, fragment) => {
    // Branded IDs are strings at runtime, so every constructor accepts a string.
    const constructors = Object.entries(fragment) as [
      string,
      (value: string) => QueryFragment,
    ][];

    it.each(constructors)("%s throws QueryValueError", (_, construct) => {
      for (const value of ["a\uD800b", "a\0b"]) {
        expect(() => construct(value)).toThrow(QueryValueError);
      }
    });
  },
);

it("refuses any string carrying a NUL or lone surrogate", () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.constantFrom("\0", "\uD800", "\uDC00"),
      (s, bad) => {
        expect(() =>
          openCypher.string(s.slice(0, 1) + bad + s.slice(1)),
        ).toThrow(QueryValueError);
      },
    ),
  );
});
