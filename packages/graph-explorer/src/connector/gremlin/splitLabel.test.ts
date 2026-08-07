import { splitLabel } from "./splitLabel";

describe("splitLabel", () => {
  it("returns a single-element array for a plain label", () => {
    expect(splitLabel("foo")).toEqual(["foo"]);
  });

  it("splits a composite label on the :: delimiter", () => {
    expect(splitLabel("foo::bar")).toEqual(["foo", "bar"]);
  });

  it("splits a composite label with more than two segments", () => {
    expect(splitLabel("foo::bar::baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("keeps a trailing :: verbatim rather than dropping the empty segment", () => {
    expect(splitLabel("foo::")).toEqual(["foo::"]);
  });

  it("keeps a leading :: verbatim rather than dropping the empty segment", () => {
    expect(splitLabel("::foo")).toEqual(["::foo"]);
  });

  it("keeps a doubled :: verbatim rather than dropping the empty segment", () => {
    expect(splitLabel("a::::b")).toEqual(["a::::b"]);
  });

  it("keeps a lone :: verbatim", () => {
    expect(splitLabel("::")).toEqual(["::"]);
  });

  it("returns the empty string unchanged", () => {
    expect(splitLabel("")).toEqual([""]);
  });
});
