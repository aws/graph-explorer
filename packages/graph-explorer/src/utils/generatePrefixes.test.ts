import generatePrefixes, {
  generateHashPrefix,
  generatePrefix,
} from "./generatePrefixes";

describe("generatePrefixes", () => {
  it("Should generate prefixes for URLs which contain a #", () => {
    const urisWithConfig = {
      "https://www.w3.org/2002/07/owl#ObjectProperty": {
        prefix: "owl",
        uri: "https://www.w3.org/2002/07/owl#",
      },
      "https://www.w3.org/2000/01/rdf-schema#subClassOf": {
        prefix: "rdf",
        uri: "https://www.w3.org/2000/01/rdf-schema#",
      },
      "https://www.w3.org/2007/05/powder-s#describedby": {
        prefix: "pow",
        uri: "https://www.w3.org/2007/05/powder-s#",
      },
      "http://www.example.com/location/resource#London": {
        prefix: "loc-r",
        uri: "http://www.example.com/location/resource#",
      },
      "http://www.example.com/soccer/resource#EPL": {
        prefix: "soc-r",
        uri: "http://www.example.com/soccer/resource#",
      },
      "https://www.w3.org/ns/prov#wasDerivedFrom": {
        prefix: "pro",
        uri: "https://www.w3.org/ns/prov#",
      },
    };

    Object.entries(urisWithConfig).forEach(([uri, config]) => {
      const result = generateHashPrefix(new URL(uri));
      expect(result.prefix).toEqual(config.prefix);
      expect(result.uri).toEqual(config.uri);
    });
  });

  it("Should generate prefixes for URLs which NOT contain a #", () => {
    const urisWithConfig = {
      "https://dbpedia.org/ontology/endowment": {
        prefix: "dbp-o",
        uri: "https://dbpedia.org/ontology/",
      },
      "https://open.vocab.org/terms/describes": {
        prefix: "ter",
        uri: "https://open.vocab.org/terms/",
      },
      "http://www.example.com/soccer/ontology/League": {
        prefix: "soc",
        uri: "http://www.example.com/soccer/ontology/",
      },
      "http://www.schema.org/City": {
        prefix: "sch",
        uri: "http://www.schema.org/",
      },
      "https://dbpedia.org/resource/Qualifying_Rounds": {
        prefix: "dbp-r",
        uri: "https://dbpedia.org/resource/",
      },
      "https://dbpedia.org/class/yago/Record106647206": {
        prefix: "yag",
        uri: "https://dbpedia.org/class/yago/",
      },
    };

    Object.entries(urisWithConfig).forEach(([uri, config]) => {
      const result = generatePrefix(new URL(uri));
      expect(result.prefix).toEqual(config.prefix);
      expect(result.uri).toEqual(config.uri);
    });
  });

  it("Should generate only non-matching prefixes and update counts", () => {
    const updatedPrefixes = generatePrefixes(
      [
        "https://www.w3.org/2002/07/owl#ObjectProperty",
        "https://dbpedia.org/resource/Qualifying_Rounds",
        "http://www.example.com/soccer/ontology/League",
        "http://www.example.com/soccer/resource#EPL",
        "http://www.example.com/location/resource#London",
        "http://www.example.com/location/resource#Manchester",
      ],
      [
        { prefix: "owl", uri: "https://www.w3.org/2002/07/owl#" },
        { prefix: "dbr", uri: "https://dbpedia.org/resource/" },
      ]
    );

    expect(updatedPrefixes).toHaveLength(5);
    expect(updatedPrefixes?.[0]).toEqual({
      prefix: "owl",
      uri: "https://www.w3.org/2002/07/owl#",
      __matches: new Set(["https://www.w3.org/2002/07/owl#ObjectProperty"]),
    });
    expect(updatedPrefixes?.[1]).toEqual({
      prefix: "dbr",
      uri: "https://dbpedia.org/resource/",
      __matches: new Set(["https://dbpedia.org/resource/Qualifying_Rounds"]),
    });
    expect(updatedPrefixes?.[2]).toEqual({
      __inferred: true,
      uri: "http://www.example.com/soccer/ontology/",
      prefix: "soc",
      __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
    });
    expect(updatedPrefixes?.[3]).toEqual({
      __inferred: true,
      uri: "http://www.example.com/soccer/resource#",
      prefix: "soc-r",
      __matches: new Set(["http://www.example.com/soccer/resource#EPL"]),
    });
    expect(updatedPrefixes?.[4]).toEqual({
      __inferred: true,
      uri: "http://www.example.com/location/resource#",
      prefix: "loc-r",
      __matches: new Set([
        "http://www.example.com/location/resource#London",
        "http://www.example.com/location/resource#Manchester",
      ]),
    });
  });
});
