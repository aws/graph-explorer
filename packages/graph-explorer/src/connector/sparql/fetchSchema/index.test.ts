import { vi } from "vitest";

import { ClientLoggerConnector } from "@/connector/LoggerConnector";
import {
  createLiteralValue,
  createUriValue,
} from "@/utils/testing/sparqlHelpers";

import type { GraphSummary } from "../types";

import fetchSchema from ".";

function summaryWithClasses(classes: string[]): GraphSummary {
  return {
    numDistinctSubjects: 0,
    numDistinctPredicates: 0,
    numQuads: 0,
    numClasses: classes.length,
    classes,
    predicates: [],
  };
}

function literalBinding(className: string, pred: string, datatype?: string) {
  return {
    class: createUriValue(className),
    pred: createUriValue(pred),
    sample: datatype
      ? { ...createLiteralValue("sample"), datatype }
      : createLiteralValue("sample"),
  };
}

describe("SPARQL > fetchSchema > predicates by class", () => {
  it("should batch classes into chunks of the batch size", async () => {
    const sparqlFetch = vi
      .fn()
      .mockResolvedValue({ results: { bindings: [] } });
    const classes = Array.from(
      { length: 250 },
      (_, i) => `http://example.org/Class${i}`,
    );

    await fetchSchema(
      sparqlFetch,
      new ClientLoggerConnector(),
      summaryWithClasses(classes),
    );

    // 250 classes at a batch size of 100 => 3 requests
    expect(sparqlFetch).toHaveBeenCalledTimes(3);

    const queries = sparqlFetch.mock.calls.map(call => call[0] as string);
    // No request carries more than the batch size (one UNION arm per class)
    for (const q of queries) {
      expect((q.match(/AS \?class/g) ?? []).length).toBeLessThanOrEqual(100);
    }
    // Every input class is covered across the requests
    const all = queries.join("\n");
    for (const className of classes) {
      expect(all).toContain(`<${className}>`);
    }
  });

  it("should regroup bindings by class into per-class attributes", async () => {
    const sparqlFetch = vi.fn().mockResolvedValueOnce({
      results: {
        bindings: [
          literalBinding(
            "http://example.org/Airport",
            "http://example.org/code",
          ),
          literalBinding(
            "http://example.org/Airport",
            "http://example.org/elevation",
            "http://www.w3.org/2001/XMLSchema#integer",
          ),
          literalBinding(
            "http://example.org/Country",
            "http://example.org/name",
          ),
        ],
      },
    });

    const schema = await fetchSchema(
      sparqlFetch,
      new ClientLoggerConnector(),
      summaryWithClasses([
        "http://example.org/Airport",
        "http://example.org/Country",
      ]),
    );

    expect(sparqlFetch).toHaveBeenCalledTimes(1);
    const airport = schema.vertices.find(
      v => v.type === "http://example.org/Airport",
    );
    const country = schema.vertices.find(
      v => v.type === "http://example.org/Country",
    );
    expect(airport?.attributes).toStrictEqual([
      { name: "http://example.org/code", dataType: "String" },
      { name: "http://example.org/elevation", dataType: "Number" },
    ]);
    expect(country?.attributes).toStrictEqual([
      { name: "http://example.org/name", dataType: "String" },
    ]);
  });

  it("should still emit a vertex with no attributes for a class with no bindings", async () => {
    const sparqlFetch = vi
      .fn()
      .mockResolvedValue({ results: { bindings: [] } });

    const schema = await fetchSchema(
      sparqlFetch,
      new ClientLoggerConnector(),
      summaryWithClasses(["http://example.org/Empty"]),
    );

    const empty = schema.vertices.find(
      v => v.type === "http://example.org/Empty",
    );
    expect(empty).toBeDefined();
    expect(empty?.attributes).toStrictEqual([]);
  });

  it("should skip bindings missing a class or predicate", async () => {
    const sparqlFetch = vi.fn().mockResolvedValueOnce({
      results: {
        bindings: [
          literalBinding("http://example.org/Airport", "http://example.org/ok"),
          { class: { type: "uri", value: "http://example.org/Airport" } },
          { pred: { type: "uri", value: "http://example.org/orphan" } },
        ],
      },
    });

    const schema = await fetchSchema(
      sparqlFetch,
      new ClientLoggerConnector(),
      summaryWithClasses(["http://example.org/Airport"]),
    );

    const airport = schema.vertices.find(
      v => v.type === "http://example.org/Airport",
    );
    expect(airport?.attributes).toStrictEqual([
      { name: "http://example.org/ok", dataType: "String" },
    ]);
  });
});
