import replacePrefixes from "./replacePrefixes";

test("should do nothing when no URI is provided", () => {
  const result = replacePrefixes(undefined);
  expect(result).toBe("");
});

test("should replace using common prefixes", () => {
  const result = replacePrefixes("http://example.com/foo/bar");
  expect(result).toBe("meat:foo/bar");
});

test("should replace using custom prefixes", () => {
  const result = replacePrefixes("http://example.com/foo/bar", [
    { prefix: "foo", uri: "http://example.com/foo/" },
  ]);
  expect(result).toBe("foo:bar");
});

test("should use generated prefixes", () => {
  const result = replacePrefixes("http://foo.com/foo/bar", [
    {
      prefix: "foo",
      uri: "http://foo.com/foo/",
      __inferred: true,
      __matches: new Set(["http://foo.com/foo/bar"]),
    },
  ]);
  expect(result).toBe("foo:bar");
});

test("should prefer common prefixes over generated prefixes", () => {
  const result = replacePrefixes("http://example.com/foo/bar", [
    {
      prefix: "foo",
      uri: "http://example.com/foo/",
      __inferred: true,
      __matches: new Set(["http://example.com/foo/bar"]),
    },
  ]);
  expect(result).toBe("meat:foo/bar");
});

test("should ignore case", () => {
  expect(replacePrefixes("HTTP://example.com/foo/bar")).toBe("meat:foo/bar");
  expect(replacePrefixes("http://Example.COM/foo/bar")).toBe("meat:foo/bar");
  expect(replacePrefixes("http://example.com/Foo/Bar")).toBe("meat:Foo/Bar");
});
