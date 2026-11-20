import { describe, expect, it } from "vite-plus/test";

import { type QueryFragment, toQueryFragment } from "@/connector/queryFragment";
import { createVertexType } from "@/core/entities/vertex";

import { joinFragments, query, stripCommonIndent } from "./sanitizeQuery";

describe("sanitizeQuery", () => {
  it("should remove leading space evenly across all lines and remove empty lines", () => {
    const value = query`
      SELECT ?subject ?pred ?value
      WHERE {
        ?subject a ?subjectClass;
                 ?pred ?value .
      }
      ${"LIMIT 10"}
    `;

    expect(value).toEqual(
      `SELECT ?subject ?pred ?value\n` +
        `WHERE {\n` +
        `  ?subject a ?subjectClass;\n` +
        `           ?pred ?value .\n` +
        `}\n` +
        `LIMIT 10`,
    );
  });

  it("should handle parameters with multiple lines", () => {
    const value = query`
      SELECT ?subject ?pred ?value
      WHERE {
        ?subject a ?subjectClass;
                 ?pred ?value .
        ${'FILTER (\n  ?subject = <http://example.org/subject>\n  && ?pred = <http://example.org/predicate>\n  && ?value = "value"\n)'}
      }
      ${"LIMIT 10\nOFFSET 10"}
    `;

    expect(value).toEqual(
      `SELECT ?subject ?pred ?value\n` +
        `WHERE {\n` +
        `  ?subject a ?subjectClass;\n` +
        `           ?pred ?value .\n` +
        `  FILTER (\n` +
        `    ?subject = <http://example.org/subject>\n` +
        `    && ?pred = <http://example.org/predicate>\n` +
        `    && ?value = "value"\n` +
        `  )\n` +
        `}\n` +
        `LIMIT 10\n` +
        `OFFSET 10`,
    );
  });

  it("preserves a value's trailing space while still trimming scaffolding trailing space", () => {
    const value = query`
      PREFIX a: ${"trailing-space "}
      END
    `;

    expect(value).toEqual(`PREFIX a: trailing-space \nEND`);
  });

  it("preserves a blank line inside a value while still dropping blank scaffolding lines", () => {
    const value = query`
      START

      ${"line1\n\nline3"}
      END
    `;

    expect(value).toEqual(`START\nline1\n\nline3\nEND`);
  });

  it("preserves an all-whitespace value instead of collapsing its line", () => {
    const value = query`
      START
      ${"   "}
      END
    `;

    expect(value).toEqual(`START\n   \nEND`);
  });

  it("preserves a value that is only a newline", () => {
    const value = query`
      START
      ${"\n"}
      END
    `;

    expect(value).toEqual(`START\n\n\nEND`);
  });

  it("leaves a flush-left scaffold line intact when other lines are indented", () => {
    const value = query`
      SELECT x
zeroindent
      END
    `;

    expect(value).toEqual(`SELECT x\nzeroindent\nEND`);
  });

  it("re-indents a multi-line value's continuation lines to the interpolation column", () => {
    const value = query`
      WHERE {
        ${"a\nb\nc"}
      }
    `;

    expect(value).toEqual(`WHERE {\n  a\n  b\n  c\n}`);
  });
});

describe("query composition", () => {
  it("nests a query result inside another query", () => {
    const inner: QueryFragment = query`b`;
    const outer: QueryFragment = query`a ${inner} c`;

    expect(outer).toBe("a b c");
  });
});

describe("joinFragments", () => {
  it("joins fragments with the separator verbatim", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];

    expect(joinFragments(parts, ",\n        ")).toBe("x,\n        y");
  });

  it("returns an empty fragment for no fragments", () => {
    expect(joinFragments([], ", ")).toBe("");
  });

  it("returns a single fragment unchanged", () => {
    expect(joinFragments([toQueryFragment("only")], ", ")).toBe("only");
  });

  it("rejects a separator that is not a string literal", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];
    const separator: string = ",";

    // @ts-expect-error the separator must be a string literal
    expect(joinFragments(parts, separator)).toBe("x,y");
  });

  it("rejects a branded string separator", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];

    // @ts-expect-error a branded string is a runtime value, not a literal
    expect(joinFragments(parts, createVertexType(","))).toBe("x,y");
  });

  it("rejects a Query Fragment separator", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];

    // @ts-expect-error a Query Fragment is a runtime value, not a literal
    expect(joinFragments(parts, toQueryFragment(","))).toBe("x,y");
  });

  it("rejects a template-literal pattern type separator", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];
    const separator: `,${string}` = ",";

    // @ts-expect-error a pattern type admits arbitrary runtime text
    expect(joinFragments(parts, separator)).toBe("x,y");
  });

  it("rejects a union of a literal and a pattern type separator", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];
    function separator(): "," | `;${string}` {
      return ",";
    }

    // @ts-expect-error every member of a union separator must be a literal
    expect(joinFragments(parts, separator())).toBe("x,y");
  });

  it("accepts a union of literals", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];
    function separator(): "," | ";" {
      return ",";
    }

    expect(joinFragments(parts, separator())).toBe("x,y");
  });

  it("accepts an empty literal", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];

    expect(joinFragments(parts, "")).toBe("xy");
  });

  it("accepts a const literal", () => {
    const parts = [toQueryFragment("x"), toQueryFragment("y")];
    const separator = " | ";

    expect(joinFragments(parts, separator)).toBe("x | y");
  });
});

describe("stripCommonIndent", () => {
  it("computes the minimum indent over non-blank lines only", () => {
    const value = stripCommonIndent("\n    a\n\n      b\n    c\n");
    expect(value).toEqual("a\n\n  b\nc");
  });

  it("uses a shallower value line as the common indent when it is the minimum", () => {
    const value = stripCommonIndent(
      "\n        deep line one\n  shallow\n        deep line two\n",
    );
    expect(value).toEqual("deep line one\nshallow\n      deep line two");
  });

  it("counts tabs and spaces per character", () => {
    const value = stripCommonIndent("\n\t\ta\n\t\t\tb\n");
    expect(value).toEqual("a\n\tb");
  });

  it("trims the leading and trailing newline", () => {
    const value = stripCommonIndent("\n  only\n");
    expect(value).toEqual("only");
  });
});
