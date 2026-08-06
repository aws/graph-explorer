import fc from "fast-check";

import type { QueryFragment } from "./queryFragment";

import { fragment as gremlin } from "./gremlin/fragments";
import { fragment as openCypher } from "./openCypher/fragments";
import { UnrepresentableStringError } from "./queryValueError";
import { fragment as sparql } from "./sparql/fragments";

const modules = { openCypher, gremlin, sparql };

describe.each(Object.entries(modules))(
  "%s constructors reject unrepresentable values",
  (_, fragment) => {
    // Every string-accepting constructor takes a string (branded IDs are
    // strings at runtime). Gremlin's `number` is the one non-string
    // constructor; the guard is a string check, so it is not part of this
    // sweep — including it would pass for an unrelated reason and mask a gap.
    const constructors = (
      Object.entries(fragment) as [string, (value: string) => QueryFragment][]
    ).filter(([name]) => name !== "number");

    it.each(constructors)(
      "%s throws UnrepresentableStringError",
      (_, construct) => {
        for (const value of ["a\uD800b", "a\0b"]) {
          expect(() => construct(value)).toThrow(
            new UnrepresentableStringError(value),
          );
        }
      },
    );
  },
);

it("refuses any string carrying a NUL or lone surrogate", () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.constantFrom("\0", "\uD800", "\uDC00"),
      (s, bad) => {
        const value = s.slice(0, 1) + bad + s.slice(1);
        expect(() => openCypher.string(value)).toThrow(
          new UnrepresentableStringError(value),
        );
      },
    ),
  );
});
