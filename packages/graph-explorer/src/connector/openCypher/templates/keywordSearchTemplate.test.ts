import { normalize } from "@/utils/testing";
import keywordSearchTemplate from "./keywordSearchTemplate";

describe("OpenCypher > keywordSearchTemplate", () => {
  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`) 
        RETURN v AS object 
      `)
    );
  });

  it("Should return a template for multiple vertex types", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport", "country"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v) 
        WHERE (v:\`airport\` OR v:\`country\`) 
        RETURN v AS object 
      `)
    );
  });

  it("Should return a template that pages properly", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      limit: 20,
      offset: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        RETURN v AS object
        SKIP 10 LIMIT 20
      `)
    );
  });

  it("Should return a template with multiple vertex types and for searched attributes containing the search term", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport", "country"],
      searchTerm: "JFK",
      searchByAttributes: ["city", "code"],
      exactMatch: false,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v)
        WHERE (v:\`airport\` OR v:\`country\`) 
          AND (v.city CONTAINS "JFK" OR v.code CONTAINS "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for searched attributes containing the search term", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchByAttributes: ["city", "code"],
      exactMatch: false,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        WHERE (v.city CONTAINS "JFK" OR v.code CONTAINS "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for searched attributes exactly matching with the search term", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchByAttributes: ["city", "code"],
      exactMatch: true,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        WHERE (v.city = "JFK" OR v.code = "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for the ID token attribute exactly matching the search term", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchById: true,
      exactMatch: true,
      searchByAttributes: ["__id"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        WHERE (id(v) = "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for the ID token attribute partially matching the search term", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchById: true,
      exactMatch: false,
      searchByAttributes: ["__id"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        WHERE (toString(id(v)) CONTAINS "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for searched attributes matching with the search terms, and the ID token attribute", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchById: true,
      searchByAttributes: ["city", "code", "__all"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v:\`airport\`)
        WHERE (toString(id(v)) CONTAINS "JFK" OR v.city CONTAINS "JFK" OR v.code CONTAINS "JFK")
        RETURN v AS object
      `)
    );
  });

  it("Should return a template for all search parameters combined", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport", "country"],
      searchTerm: "JFK",
      searchById: true,
      exactMatch: false,
      searchByAttributes: ["city", "code", "__all"],
      limit: 50,
      offset: 25,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v)
        WHERE (v:\`airport\` OR v:\`country\`)
          AND (toString(id(v)) CONTAINS "JFK" OR v.city CONTAINS "JFK" OR v.code CONTAINS "JFK")
        RETURN v AS object
        SKIP 25 LIMIT 50
      `)
    );
  });
});
