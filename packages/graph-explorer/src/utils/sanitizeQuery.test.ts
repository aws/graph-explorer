import { query } from "./sanitizeQuery";

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
});
