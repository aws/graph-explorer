import { SEARCH_TOKENS } from "@/utils";
import { normalize } from "@/utils/testing";

import keywordSearchTemplate from "./keywordSearchTemplate";

describe("SPARQL > keywordSearchTemplate", () => {
  it("Should return a template for an empty request", () => {
    const template = keywordSearchTemplate({});

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template with paging", () => {
    const template = keywordSearchTemplate({
      limit: 10,
      offset: 20,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
            }
            LIMIT 10 OFFSET 20
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template with just a limit", () => {
    const template = keywordSearchTemplate({
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
            }
            LIMIT 10
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template where a limit of zero is not limited", () => {
    const template = keywordSearchTemplate({
      limit: 0,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?class IN (<air:airport>))
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template for searched attributes containing the search term", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      predicates: ["air:city", "air:code"],
      exactMatch: false,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (regex(str(?value), "JFK", "i"))
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template for searched attributes exactly matching with the search term", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      predicates: ["air:city", "air:code"],
      exactMatch: true,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template for searched attributes without the all attributes token predicate", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      predicates: ["air:city", "air:code", SEARCH_TOKENS.ALL_ATTRIBUTES],
      exactMatch: true,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template for the ID token attribute exactly matching the search term", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      exactMatch: true,
      predicates: ["rdfs:label"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<rdfs:label>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });

  it("Should return a template for the ID token attribute partially matching the search term", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      exactMatch: false,
      predicates: ["rdfs:label"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            # This sub-query will find any matching instances to the given filters and limit the results
            SELECT DISTINCT ?subject
            WHERE {
              ?subject ?pValue ?value .
              OPTIONAL { ?subject a ?class } .
              FILTER (?pValue IN (<rdfs:label>))
              FILTER (?class IN (<air:airport>))
              FILTER (regex(str(?value), "JFK", "i"))
            }
          }
          {
            # Values and types
            ?subject ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          }
        }
      `),
    );
  });
});
