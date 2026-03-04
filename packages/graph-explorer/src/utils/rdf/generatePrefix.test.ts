import { generatePrefix } from "./generatePrefix";

describe("generatePrefix", () => {
  // ---------------------------------------------------------------------------
  // Null returns
  // ---------------------------------------------------------------------------

  it("returns null for non-IRI strings", () => {
    expect(generatePrefix("not a url")).toBeNull();
    expect(generatePrefix("")).toBeNull();
    expect(generatePrefix("just-text")).toBeNull();
  });

  it("returns null for IRIs without a namespace or value", () => {
    expect(generatePrefix("http://example.org/")).toBeNull();
    expect(generatePrefix("http://example.org")).toBeNull();
    expect(generatePrefix("http://example.org/#")).toBeNull();
  });

  it("returns null for non-URL schemes", () => {
    expect(generatePrefix("urn:Person")).toBeNull();
    expect(generatePrefix("urn:isbn:1234567890")).toBeNull();
    expect(generatePrefix("mailto:example@abc.com")).toBeNull();
    expect(generatePrefix("custom-scheme:foo")).toBeNull();
  });

  it("returns null for file URIs", () => {
    expect(generatePrefix("file://foo/bar.txt")).toBeNull();
    expect(generatePrefix("file:///home/user/doc.txt")).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Lowercase output
  // ---------------------------------------------------------------------------

  it("generates lowercase prefixes regardless of IRI casing", () => {
    expect(generatePrefix("http://ExAmPlE.org/Thing")!.prefix).toBe("example");
    expect(generatePrefix("http://example.org/MyDomain/Thing")!.prefix).toBe(
      "myd",
    );
    expect(
      generatePrefix("http://example.org/ANIMALS/Ontology/Cat")!.prefix,
    ).toBe("animals-o");
  });

  // ---------------------------------------------------------------------------
  // Segment truncation
  // ---------------------------------------------------------------------------

  it("truncates meaningful segments longer than 8 characters", () => {
    expect(
      generatePrefix("http://example.org/verylongsegmentnamehere/Thing")!
        .prefix,
    ).toBe("verylong");
    expect(
      generatePrefix("http://example.org/abcdefghijklmnop/Thing")!.prefix,
    ).toBe("abcdefgh");
  });

  it("preserves segments that are exactly 8 characters", () => {
    expect(generatePrefix("http://example.org/abcdefgh/Thing")!.prefix).toBe(
      "abcdefgh",
    );
  });

  it("does not leave trailing separators after truncation", () => {
    // "abcdefg." truncated to 8 would be "abcdefg." — the dot must be stripped
    expect(
      generatePrefix("http://example.org/abcdefg.hijk/Thing")!.prefix,
    ).toBe("abcdefg");
    // "abcdefg-" truncated to 8 would be "abcdefg-" — the hyphen must be stripped
    expect(
      generatePrefix("http://example.org/abcdefg-hijk/Thing")!.prefix,
    ).toBe("abcdefg");
    // "abcdefg_" truncated to 8 would be "abcdefg_" — the underscore must be stripped
    expect(
      generatePrefix("http://example.org/abcdefg_hijk/Thing")!.prefix,
    ).toBe("abcdefg");
  });

  // ---------------------------------------------------------------------------
  // Host extraction
  // ---------------------------------------------------------------------------

  it("strips the www prefix from the host", () => {
    expect(generatePrefix("http://www.schema.org/City")!.prefix).toBe("schema");
    expect(generatePrefix("http://www.example.org/Thing")!.prefix).toBe(
      "example",
    );
    expect(generatePrefix("http://www.dbpedia.org/Thing")!.prefix).toBe(
      "dbpedia",
    );
  });

  it("strips the port number from the host", () => {
    expect(generatePrefix("http://example.org:8080/Thing")!.prefix).toBe(
      "example",
    );
    expect(generatePrefix("http://example.co.uk:8080/Thing")!.prefix).toBe(
      "example",
    );
    expect(generatePrefix("http://my-host.org:3000/Thing")!.prefix).toBe(
      "my-host",
    );
  });

  it("extracts the domain name from a two-part host", () => {
    expect(generatePrefix("http://example.org/Thing")!.prefix).toBe("example");
    expect(generatePrefix("http://dbpedia.org/Thing")!.prefix).toBe("dbpedia");
    expect(generatePrefix("http://my-host.org/Thing")!.prefix).toBe("my-host");
  });

  it("skips short subdomains and uses the main domain for 3+ part hosts", () => {
    // "sub" is <=3 chars, so skip to "example"
    expect(generatePrefix("http://sub.example.org/Thing")!.prefix).toBe(
      "example",
    );
    // "api" is <=3 chars, so skip to "dbpedia"
    expect(generatePrefix("http://api.dbpedia.org/Thing")!.prefix).toBe(
      "dbpedia",
    );
    // "co" is <=3 chars in "example.co.uk", so skip to "example"
    expect(generatePrefix("http://example.co.uk/Thing")!.prefix).toBe(
      "example",
    );
    // "www" is already stripped, then "sub" is <=3 chars, so skip to "example"
    expect(generatePrefix("http://www.sub.example.org/Thing")!.prefix).toBe(
      "example",
    );
    // When all host parts are short, the second part is still used
    expect(generatePrefix("http://ab.cd.io/Thing")!.prefix).toBe("cd");
    expect(generatePrefix("http://a.b.c/Thing")!.prefix).toBe("b");
  });

  it("uses the first part for two-part hosts regardless of length", () => {
    expect(generatePrefix("http://sub.io/Thing")!.prefix).toBe("sub");
    expect(generatePrefix("http://x.y/Thing")!.prefix).toBe("x");
  });

  it("keeps long subdomains as the prefix for 3+ part hosts", () => {
    // "data" is 4 chars (>3), so it's kept
    expect(generatePrefix("http://data.example.org/Thing")!.prefix).toBe(
      "data",
    );
    // "kelvinlawrence" is >3 chars, kept and truncated
    expect(
      generatePrefix("http://kelvinlawrence.example.org/Thing")!.prefix,
    ).toBe("kelvinla");
    // "long-subdomain" is >3 chars, kept and truncated
    expect(
      generatePrefix("http://long-subdomain.example.org/Thing")!.prefix,
    ).toBe("long-sub");
  });

  it("uses the full host when it has no dots", () => {
    expect(generatePrefix("http://localhost/Thing")!.prefix).toBe("localhos");
    expect(generatePrefix("http://myserver/Thing")!.prefix).toBe("myserver");
  });

  it("truncates long host-derived prefixes to 8 characters", () => {
    expect(
      generatePrefix("http://this-is-a-very-long-hostname.org/Thing")!.prefix,
    ).toBe("this-is");
    expect(generatePrefix("http://localhost/Thing")!.prefix).toBe("localhos");
  });

  it("preserves hyphens in host-derived prefixes", () => {
    expect(generatePrefix("http://my-host.org/Thing")!.prefix).toBe("my-host");
    expect(generatePrefix("http://my-data-service.org/Thing")!.prefix).toBe(
      "my-data",
    );
  });

  it("falls back to ns when the host is entirely numeric", () => {
    expect(generatePrefix("http://192.168.1.1/Thing")!.prefix).toBe("ns");
    expect(generatePrefix("http://10.0.0.1/Thing")!.prefix).toBe("ns");
  });

  it("strips leading digits from host-derived prefixes", () => {
    expect(generatePrefix("http://123host.org/Thing")!.prefix).toBe("host");
    expect(generatePrefix("http://42data.org/Thing")!.prefix).toBe("data");
  });

  // ---------------------------------------------------------------------------
  // Host fallback (no meaningful path segments)
  // ---------------------------------------------------------------------------

  it("uses the host when the namespace has no path segments", () => {
    expect(generatePrefix("http://example.org/#value")!.prefix).toBe("example");
    expect(generatePrefix("http://www.schema.org/City")!.prefix).toBe("schema");
    expect(generatePrefix("http://dbpedia.org/Thing")!.prefix).toBe("dbpedia");
  });

  it("appends abbreviation suffix to host when only abbreviated segments exist", () => {
    expect(
      generatePrefix("https://dbpedia.org/ontology/endowment")!.prefix,
    ).toBe("dbpedia-o");
    expect(
      generatePrefix("https://dbpedia.org/resource/Qualifying_Rounds")!.prefix,
    ).toBe("dbpedia-r");
    expect(
      generatePrefix("http://example.org/ontology/resource/Thing")!.prefix,
    ).toBe("example-or");
  });

  it("falls back to the full abbreviated name when the host is unusable", () => {
    expect(generatePrefix("http://192.168.1.1/ontology/Thing")!.prefix).toBe(
      "ontology",
    );
    expect(generatePrefix("http://172.16.0.1/resource/Thing")!.prefix).toBe(
      "resource",
    );
  });

  it("falls back to host when only ignored segments exist", () => {
    expect(generatePrefix("http://example.org/ns//Thing")!.prefix).toBe(
      "example",
    );
    expect(generatePrefix("http://example.org/ns/ns/Thing")!.prefix).toBe(
      "example",
    );
  });

  // ---------------------------------------------------------------------------
  // Abbreviated segments
  // ---------------------------------------------------------------------------

  it("abbreviates each structural term to its short form", () => {
    const base = "http://example.org/animals";
    expect(generatePrefix(`${base}/ontology/Cat`)!.prefix).toBe("animals-o");
    expect(generatePrefix(`${base}/resource/Cat`)!.prefix).toBe("animals-r");
    expect(generatePrefix(`${base}/class/Cat`)!.prefix).toBe("animals-c");
    expect(generatePrefix(`${base}/vocab/Cat`)!.prefix).toBe("animals-v");
    expect(generatePrefix(`${base}/vocabulary/Cat`)!.prefix).toBe("animals-v");
    expect(generatePrefix(`${base}/schema/Cat`)!.prefix).toBe("animals-s");
    expect(generatePrefix(`${base}/def/Cat`)!.prefix).toBe("animals-d");
    expect(generatePrefix(`${base}/terms/Cat`)!.prefix).toBe("animals-t");
    expect(generatePrefix(`${base}/property/Cat`)!.prefix).toBe("animals-p");
    expect(generatePrefix(`${base}/datatype/Cat`)!.prefix).toBe("animals-dt");
    expect(generatePrefix(`${base}/data/Cat`)!.prefix).toBe("animals-da");
    expect(generatePrefix(`${base}/model/Cat`)!.prefix).toBe("animals-m");
    expect(generatePrefix(`${base}/core/Cat`)!.prefix).toBe("animals-co");
    expect(generatePrefix(`${base}/entity/Cat`)!.prefix).toBe("animals-e");
    expect(generatePrefix(`${base}/entities/Cat`)!.prefix).toBe("animals-e");
  });

  it("abbreviates compound structural terms", () => {
    expect(
      generatePrefix(
        "http://kelvinlawrence.net/air-routes/objectProperty#route",
      )!.prefix,
    ).toBe("air-op");
    expect(
      generatePrefix(
        "http://kelvinlawrence.net/air-routes/datatypeProperty/name",
      )!.prefix,
    ).toBe("air-dp");
    expect(
      generatePrefix(
        "http://kelvinlawrence.net/air-routes/objectProperty/route",
      )!.prefix,
    ).toBe("air-op");
  });

  it("matches abbreviated segments case-insensitively", () => {
    expect(
      generatePrefix("http://example.org/animals/Ontology/Cat")!.prefix,
    ).toBe("animals-o");
    expect(
      generatePrefix("http://example.org/animals/RESOURCE/Cat")!.prefix,
    ).toBe("animals-r");
    expect(generatePrefix("http://example.org/animals/Class/Cat")!.prefix).toBe(
      "animals-c",
    );
  });

  it("only appends abbreviations that come after the primary segment", () => {
    // "ontology" is before "animals" — it's not appended as a suffix
    expect(
      generatePrefix("http://example.org/ontology/animals/Cat")!.prefix,
    ).toBe("animals");
    // "class" is before "animals", "schema" is after — only "-s" appended
    expect(
      generatePrefix("http://example.org/class/animals/schema/Cat")!.prefix,
    ).toBe("animals-s");
    // "ontology" before, "resource" after
    expect(
      generatePrefix("http://example.org/ontology/animals/resource/Cat")!
        .prefix,
    ).toBe("animals-r");
  });

  it("appends multiple abbreviation suffixes when chained after the primary", () => {
    expect(
      generatePrefix("http://example.org/ontology/schema#Thing")!.prefix,
    ).toBe("example-os");
    expect(
      generatePrefix("http://example.org/ontology/resource/Thing")!.prefix,
    ).toBe("example-or");
  });

  // ---------------------------------------------------------------------------
  // Ignored segments
  // ---------------------------------------------------------------------------

  it("completely drops ignored segments from the prefix", () => {
    expect(generatePrefix("http://example.org/animals/ns/Cat")!.prefix).toBe(
      "animals",
    );
    // "ns" is ignored, so "animals" is still the primary with "-o" suffix
    expect(
      generatePrefix("http://example.org/ns/animals/ontology/Cat")!.prefix,
    ).toBe("animals-o");
    // Multiple ignored segments are all dropped
    expect(generatePrefix("http://example.org/ns/ns/animals/Cat")!.prefix).toBe(
      "animals",
    );
  });

  // ---------------------------------------------------------------------------
  // Right-to-left ordering
  // ---------------------------------------------------------------------------

  it("uses the rightmost meaningful segment as the primary prefix", () => {
    // "animals" is rightmost meaningful
    expect(generatePrefix("https://example.org/foo/animals#Cat")!.prefix).toBe(
      "fanimals",
    );
    // "gamma" is rightmost meaningful
    expect(
      generatePrefix("http://example.org/alpha/beta/gamma/Thing")!.prefix,
    ).toBe("abgamma");
    // "two" is rightmost meaningful
    expect(generatePrefix("http://example.org/one/two/Thing")!.prefix).toBe(
      "otwo",
    );
    // "yago" is rightmost meaningful (class is abbreviated)
    expect(
      generatePrefix("https://dbpedia.org/class/yago/Record106647206")!.prefix,
    ).toBe("yago");
  });

  // ---------------------------------------------------------------------------
  // Leading initials from earlier meaningful segments
  // ---------------------------------------------------------------------------

  it("prepends word initials from meaningful segments before the primary", () => {
    // "foo" → "f", primary = "animals"
    expect(generatePrefix("https://example.org/foo/animals#Cat")!.prefix).toBe(
      "fanimals",
    );
    // "alpha" → "a", "beta" → "b", primary = "gamma"
    expect(
      generatePrefix("http://example.org/alpha/beta/gamma/Thing")!.prefix,
    ).toBe("abgamma");
    // "air-routes" splits to ["air", "routes"] → initials "ar", primary = abbreviated
    expect(
      generatePrefix("http://kelvinlawrence.net/air-routes/class/Airport")!
        .prefix,
    ).toBe("air-c");
    // "foo" → "f", primary = "bar" (leading 3 stripped by sanitize)
    expect(generatePrefix("http://example.org/foo/3bar/Thing")!.prefix).toBe(
      "fbar",
    );
  });

  // ---------------------------------------------------------------------------
  // Short first word enrichment
  // ---------------------------------------------------------------------------

  it("enriches short first words with initials of remaining words in the segment", () => {
    // "My" is <3 chars, enriched with "N" from "Namespace"
    expect(generatePrefix("http://example.org/MyNamespace/Thing")!.prefix).toBe(
      "myn",
    );
    // "My" is <3 chars, enriched with "O" from "Ontology"
    expect(generatePrefix("http://example.org/MyOntology#Person")!.prefix).toBe(
      "myo",
    );
    // "v" is <3 chars, enriched with "1", "2", "3" from dot-split words
    expect(generatePrefix("http://example.org/v1.2.3/Thing")!.prefix).toBe(
      "v123",
    );
  });

  it("does not enrich first words that are 3 or more characters", () => {
    // "air" is 3 chars — no enrichment
    expect(generatePrefix("http://example.org/air-routes/Thing")!.prefix).toBe(
      "air",
    );
    // "foo" is 3 chars — no enrichment
    expect(generatePrefix("http://example.org/foo/Thing")!.prefix).toBe("foo");
  });

  // ---------------------------------------------------------------------------
  // Numeric-only segment skipping
  // ---------------------------------------------------------------------------

  it("skips numeric-only path segments", () => {
    // "2024" and "01" are numeric-only, "schema" is abbreviated → host + "-s"
    expect(
      generatePrefix("http://example.org/2024/01/schema#Thing")!.prefix,
    ).toBe("example-s");
    // "2002", "07" are numeric-only, "owl" is meaningful
    expect(
      generatePrefix("http://www.w3.org/2002/07/owl#ObjectProperty")!.prefix,
    ).toBe("owl");
    // "2024" is numeric, "animals" is meaningful, "01" is numeric, "vocab" is abbreviated
    expect(
      generatePrefix("http://example.org/2024/animals/01/vocab/Cat")!.prefix,
    ).toBe("animals-v");
  });

  // ---------------------------------------------------------------------------
  // Sanitization
  // ---------------------------------------------------------------------------

  it("strips leading digits from segment-derived prefixes", () => {
    expect(generatePrefix("http://example.org/3dmodel/Thing")!.prefix).toBe(
      "dmodel",
    );
    expect(generatePrefix("http://example.org/99bottles/Thing")!.prefix).toBe(
      "bottles",
    );
  });

  it("strips leading underscores from segment-derived prefixes", () => {
    expect(generatePrefix("http://example.org/_private/Thing")!.prefix).toBe(
      "private",
    );
    expect(generatePrefix("http://example.org/__internal/Thing")!.prefix).toBe(
      "internal",
    );
  });

  it("removes non-alphanumeric characters except hyphens and underscores", () => {
    // "my-special_ns.v2" splits into words, initials produce "mysnv"
    expect(
      generatePrefix("http://example.org/my-special_ns.v2/Item")!.prefix,
    ).toBe("mysnv");
  });

  it("falls back to ns when a segment is entirely special characters", () => {
    expect(generatePrefix("http://example.org/---/Thing")!.prefix).toBe("ns");
    expect(generatePrefix("http://example.org/.../Thing")!.prefix).toBe("ns");
  });

  // ---------------------------------------------------------------------------
  // Determinism
  // ---------------------------------------------------------------------------

  it("returns deterministic results for the same input", () => {
    const a = generatePrefix("http://example.org/foo/Bar");
    const b = generatePrefix("http://example.org/foo/Bar");
    expect(a).toEqual(b);
  });

  // ---------------------------------------------------------------------------
  // Real-world RDF namespace examples
  // ---------------------------------------------------------------------------

  it("generates prefixes for well-known RDF namespaces", () => {
    expect(
      generatePrefix("http://www.w3.org/2002/07/owl#ObjectProperty")!.prefix,
    ).toBe("owl");
    expect(
      generatePrefix("http://www.w3.org/2000/01/rdf-schema#subClassOf")!.prefix,
    ).toBe("rdf");
  });

  it("allows short prefixes from short meaningful segments", () => {
    expect(generatePrefix("http://example.org/a/Thing")!.prefix).toBe("a");
  });
});
