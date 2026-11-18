import { describe, expect, it } from "vite-plus/test";

import { normalize } from "@/utils/testing";

import keywordSearchBlankNodesIdsTemplate from "./keywordSearchBlankNodesIdsTemplate";

describe("SPARQL > keywordSearchBlankNodesIdsTemplate", () => {
  it("should wrap the subject sub-query and select only blank nodes", () => {
    const template = keywordSearchBlankNodesIdsTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      predicates: ["air:city"],
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT (?subject as ?bNode)
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<air:city>))
              FILTER (?class IN (<air:airport>))
              FILTER (CONTAINS(LCASE(STR(?value)), LCASE("JFK")))
            }
            LIMIT 10
          }
          FILTER(isBlank(?subject))
        }
      `),
    );
  });

  it("emits the exact query text with every option", () => {
    const template = keywordSearchBlankNodesIdsTemplate({
      searchTerm: 'J"hn',
      predicates: ["http://e/p1", "http://e/p2"],
      subjectClasses: ["http://e/T"],
      limit: 10,
      offset: 5,
    });

    expect(template).toBe(
      [
        "# Fetch all blank nodes ids from a generic keyword search request",
        "SELECT DISTINCT (?subject as ?bNode)",
        "WHERE {",
        "  {",
        "    # This sub-query will find any matching instances to the given filters and limit the results",
        "    SELECT DISTINCT ?subject",
        "    WHERE {",
        "      ?subject ?pValue ?value .",
        "      OPTIONAL { ?subject a ?class } .",
        "      FILTER (?pValue IN (<http://e/p1>, <http://e/p2>))",
        "      FILTER (?class IN (<http://e/T>))",
        '      FILTER (CONTAINS(LCASE(STR(?value)), LCASE("J\\"hn")))',
        "    }",
        "    LIMIT 10 OFFSET 5",
        "  }",
        "  FILTER(isBlank(?subject))",
        "}",
      ].join("\n"),
    );
  });
});
