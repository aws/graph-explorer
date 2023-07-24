import keywordSearchTemplate from "./keywordSearchTemplate";

describe("Gremlin > keywordSearchTemplate", () => {
  it("Should return a template only with default range", () => {
    const template = keywordSearchTemplate({});

    expect(template).toBe("g.V().range(0,10)");
  });

  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
    });

    expect(template).toBe('g.V().hasLabel("airport").range(0,10)');
  });

  it("Should return a template for searched attributes matching with the search term", () => {
    const template = keywordSearchTemplate({
      searchTerm: "JFK",
      searchById: true,
      searchByAttributes: ["city", "code"],
    });

    expect(template).toBe(
      'g.V().or(has(id,containing("JFK")),has("city",containing("JFK")),has("code",containing("JFK"))).range(0,10)'
    );
  });

  it("Should return a template with an offset and limit", () => {
    const template = keywordSearchTemplate({
      searchTerm: "JFK",
      searchByAttributes: ["code"],
      searchById: false,
      offset: 2,
      limit: 10,
    });

    expect(template).toBe(
      'g.V().or(has("code",containing("JFK"))).range(2,12)'
    );
  });

  it("Should return a template for a specific vertex type", () => {
    const template = keywordSearchTemplate({
      searchTerm: "JFK",
      vertexTypes: ["airport"],
      searchByAttributes: ["code"],
      searchById: false,
      limit: 25,
      offset: 1,
    });

    expect(template).toBe(
      'g.V().hasLabel("airport").or(has("code",containing("JFK"))).range(1,26)'
    );
  });
});
