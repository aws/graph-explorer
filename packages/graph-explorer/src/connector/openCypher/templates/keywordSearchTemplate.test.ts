import keywordSearchTemplate from "./keywordSearchTemplate";

describe("OpenCypher > keywordSearchTemplate", () => {
  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
    });

    expect(template).toBe('MATCH (v:\`airport\`) RETURN v AS object SKIP 0 LIMIT 10');
  });

  it("Should return a template for searched attributes matching with the search terms", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchById: true,
      searchByAttributes: ["city", "code"],
    });

    expect(template).toBe(
        'MATCH (v:`airport`) ' +
        'WHERE v.city CONTAINS "JFK"  ' +
        'OR v.code CONTAINS "JFK"   ' +
        'RETURN v AS object ' +
        'SKIP 0 LIMIT 10'
    );
  });

  it("Should return a template for searched attributes matching with the search terms, and the ID token attribute", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
      searchTerm: "JFK",
      searchById: true,
      searchByAttributes: ["city", "code", "__all"],
    });

    expect(template).toBe(
        'MATCH (v:`airport`) ' +
        'WHERE v.`~id` CONTAINS "JFK"  ' +
        'OR v.city CONTAINS "JFK"  ' +
        'OR v.code CONTAINS "JFK"   ' +
        'RETURN v AS object ' +
        'SKIP 0 LIMIT 10');
  });
});


