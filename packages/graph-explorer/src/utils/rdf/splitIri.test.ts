import { splitIri } from "./splitIri";

describe("splitIri", () => {
  it("returns null for non-IRI strings", () => {
    expect(splitIri("not a url")).toBeNull();
    expect(splitIri("just-text")).toBeNull();
    expect(splitIri("")).toBeNull();
  });

  it("returns null for URIs without a path or fragment value", () => {
    expect(splitIri("http://example.org/")).toBeNull();
    expect(splitIri("http://example.org")).toBeNull();
    expect(splitIri("http://example.org/#")).toBeNull();
  });

  it("returns null for non-URL schemes like urn or mailto", () => {
    expect(splitIri("urn:Person")).toBeNull();
    expect(splitIri("urn:isbn:1234567890")).toBeNull();
    expect(splitIri("mailto:example@abc.com")).toBeNull();
    expect(splitIri("custom-scheme:foo")).toBeNull();
  });

  it("splits a hash IRI into namespace and value", () => {
    expect(splitIri("http://example.org/ontology#Person")).toEqual({
      namespace: "http://example.org/ontology#",
      value: "Person",
    });
    expect(splitIri("https://www.w3.org/2002/07/owl#ObjectProperty")).toEqual({
      namespace: "https://www.w3.org/2002/07/owl#",
      value: "ObjectProperty",
    });
  });

  it("splits a slash IRI into namespace and value", () => {
    expect(splitIri("http://example.org/resource/London")).toEqual({
      namespace: "http://example.org/resource/",
      value: "London",
    });
    expect(splitIri("https://dbpedia.org/ontology/endowment")).toEqual({
      namespace: "https://dbpedia.org/ontology/",
      value: "endowment",
    });
  });

  it("handles IRIs with multiple path segments", () => {
    expect(splitIri("https://dbpedia.org/class/yago/Record106647206")).toEqual({
      namespace: "https://dbpedia.org/class/yago/",
      value: "Record106647206",
    });
  });

  it("returns null when hash fragment is empty", () => {
    expect(splitIri("http://example.org/ontology#")).toBeNull();
  });

  it("returns null for file URIs", () => {
    expect(splitIri("file://foo/bar.txt")).toBeNull();
  });

  it("splits hash IRIs with multiple hash characters at the last #", () => {
    expect(splitIri("http://example.org/ontology#foo#bar")).toEqual({
      namespace: "http://example.org/ontology#foo#",
      value: "bar",
    });
  });

  it("splits a hash IRI with no path segments", () => {
    expect(splitIri("http://example.org#value")).toEqual({
      namespace: "http://example.org#",
      value: "value",
    });
  });

  it("preserves original casing in namespace and value", () => {
    expect(splitIri("HTTP://Example.ORG/Ontology#Person")).toEqual({
      namespace: "HTTP://Example.ORG/Ontology#",
      value: "Person",
    });
  });

  it("handles FTP scheme", () => {
    expect(splitIri("ftp://example.org/resource/Thing")).toEqual({
      namespace: "ftp://example.org/resource/",
      value: "Thing",
    });
  });

  describe("local value validation", () => {
    it("accepts underscores, hyphens, and periods", () => {
      expect(splitIri("http://example.org/ns/my_item")).toEqual({
        namespace: "http://example.org/ns/",
        value: "my_item",
      });
      expect(splitIri("http://example.org/ns/my-item")).toEqual({
        namespace: "http://example.org/ns/",
        value: "my-item",
      });
      expect(splitIri("http://example.org/ns/v2.0")).toEqual({
        namespace: "http://example.org/ns/",
        value: "v2.0",
      });
    });

    it("accepts percent-encoded sequences", () => {
      expect(splitIri("http://example.org/ns/caf%C3%A9")).toEqual({
        namespace: "http://example.org/ns/",
        value: "caf%C3%A9",
      });
    });

    it("accepts Unicode letters", () => {
      expect(splitIri("http://example.org/ns/café")).toEqual({
        namespace: "http://example.org/ns/",
        value: "café",
      });
    });

    it("accepts middle dot", () => {
      expect(splitIri("http://example.org/ns/item·1")).toEqual({
        namespace: "http://example.org/ns/",
        value: "item·1",
      });
    });

    it("rejects local values with spaces", () => {
      expect(splitIri("http://example.org/ns/my item")).toBeNull();
    });

    it("rejects local values with angle brackets", () => {
      expect(splitIri("http://example.org/ns/a<b")).toBeNull();
      expect(splitIri("http://example.org/ns/a>b")).toBeNull();
    });

    it("rejects local values with curly braces", () => {
      expect(splitIri("http://example.org/ns/a{b}")).toBeNull();
    });

    it("rejects local values with pipes", () => {
      expect(splitIri("http://example.org/ns/a|b")).toBeNull();
    });

    it("rejects local values with carets", () => {
      expect(splitIri("http://example.org/ns/a^b")).toBeNull();
    });

    it("rejects local values with backticks", () => {
      expect(splitIri("http://example.org/ns/a`b")).toBeNull();
    });

    it("rejects local values with backslashes", () => {
      expect(splitIri("http://example.org/ns/a\\b")).toBeNull();
    });

    it("validates hash IRI local values", () => {
      expect(splitIri("http://example.org/ns#valid-name")).toEqual({
        namespace: "http://example.org/ns#",
        value: "valid-name",
      });
      expect(splitIri("http://example.org/ns#invalid name")).toBeNull();
    });
  });

  it("splits on the last # when path contains percent-encoded %23", () => {
    expect(splitIri("http://example.org/foo%23bar#value")).toEqual({
      namespace: "http://example.org/foo%23bar#",
      value: "value",
    });
  });
});
