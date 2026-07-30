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

    expect(normalize(template)).toContain(
      normalize("SELECT DISTINCT (?subject as ?bNode)"),
    );
    expect(normalize(template)).toContain(
      normalize("SELECT DISTINCT ?subject"),
    );
    expect(normalize(template)).toContain(
      normalize("FILTER (?pValue IN (<air:city>))"),
    );
    expect(normalize(template)).toContain(
      normalize("FILTER (?class IN (<air:airport>))"),
    );
    expect(normalize(template)).toContain(
      normalize('FILTER (regex(str(?value), "JFK", "i"))'),
    );
    expect(normalize(template)).toContain(normalize("LIMIT 10"));
    expect(normalize(template)).toContain(
      normalize("FILTER(isBlank(?subject))"),
    );
  });
});
