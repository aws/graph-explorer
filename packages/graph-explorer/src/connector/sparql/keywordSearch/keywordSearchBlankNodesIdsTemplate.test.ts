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
              FILTER (CONTAINS(LCASE(str(?value)), LCASE("JFK")))
            }
            LIMIT 10
          }
          FILTER(isBlank(?subject))
        }
      `),
    );
  });
});
