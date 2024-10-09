import { normalize } from "@/utils/testing";
import keywordSearchTemplate from "./keywordSearchTemplate";

describe("SPARQL > keywordSearchTemplate", () => {
  it("Should return a template for an empty request", () => {
    const template = keywordSearchTemplate({});

    expect(normalize(template)).toBe(
      normalize(`
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
    );
  });

  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?class IN (<air:airport>))
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
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
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?predicate IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (regex(str(?value), "JFK", "i"))
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
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
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?predicate IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
    );
  });

  it("Should return a template for searched attributes without the __all predicate", () => {
    const template = keywordSearchTemplate({
      subjectClasses: ["air:airport"],
      searchTerm: "JFK",
      predicates: ["air:city", "air:code", "__all"],
      exactMatch: true,
    });

    expect(normalize(template)).toBe(
      normalize(`
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?predicate IN (<air:city>, <air:code>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
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
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?predicate IN (<rdfs:label>))
              FILTER (?class IN (<air:airport>))
              FILTER (?value = "JFK")
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
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
        SELECT ?subject ?pred ?value ?class { 
          ?subject ?pred ?value { 
            SELECT DISTINCT ?subject ?class { 
              ?subject a ?class ; ?predicate ?value . 
              FILTER (?predicate IN (<rdfs:label>))
              FILTER (?class IN (<air:airport>))
              FILTER (regex(str(?value), "JFK", "i"))
            } 
            LIMIT 10 OFFSET 0 
          } 
          FILTER(isLiteral(?value)) 
        }
      `)
    );
  });
});
