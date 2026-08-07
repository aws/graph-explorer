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

  it("does not split on a single colon", () => {
    expect(splitLabel("foo:bar")).toEqual(["foo:bar"]);
  });

  it("does not split on three colons", () => {
    expect(splitLabel("foo:::bar")).toEqual(["foo:::bar"]);
  });

  it("does not split on four colons", () => {
    expect(splitLabel("foo::::bar")).toEqual(["foo::::bar"]);
  });

  it("splits only on the run of exactly two colons", () => {
    expect(splitLabel("a:::b::c")).toEqual(["a:::b", "c"]);
  });

  it("keeps a lone :: verbatim", () => {
    expect(splitLabel("::")).toEqual(["::"]);
  });

  it("returns the empty string unchanged", () => {
    expect(splitLabel("")).toEqual([""]);
  });
});
