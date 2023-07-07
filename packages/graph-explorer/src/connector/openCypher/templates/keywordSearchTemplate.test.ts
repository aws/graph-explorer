import keywordSearchTemplate from "./keywordSearchTemplate";

describe("OpenCypher > keywordSearchTemplate", () => {
  it("Should return a template only for vertex type", () => {
    const template = keywordSearchTemplate({
      vertexTypes: ["airport"],
    });

    expect(template).toBe('MATCH (v:\`airport\`) RETURN v AS object SKIP 0 LIMIT 10');
  });
});
