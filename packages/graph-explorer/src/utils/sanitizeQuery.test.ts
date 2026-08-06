import { query, stripCommonIndent } from "./sanitizeQuery";

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
