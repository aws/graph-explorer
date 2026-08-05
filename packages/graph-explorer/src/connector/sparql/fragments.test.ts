import { createEdgeId, createVertexId } from "@/core";

import { UnsupportedValueTypeError } from "../queryValueError";
import { fragment } from "./fragments";

describe("fragment.string", () => {
  it("should wrap the value in double quotes", () => {
    expect(fragment.string("test")).toEqual('"test"');
  });

  it("should preserve surrounding whitespace", () => {
    expect(fragment.string(" te st ")).toEqual('" te st "');
  });

  it("should produce an empty literal for an empty string", () => {
    expect(fragment.string("")).toEqual('""');
  });

  it("should escape a double quote", () => {
    expect(fragment.string('te"st')).toEqual('"te\\"st"');
  });

  it("should leave a single quote alone, since it needs no escaping", () => {
    expect(fragment.string("t'est")).toEqual('"t\'est"');
  });
});

describe("fragment.iri", () => {
  it("should wrap the value in angle brackets", () => {
    expect(fragment.iri("http://example.com/thing")).toEqual(
      "<http://example.com/thing>",
    );
  });

  it("should accept a vertex ID", () => {
    expect(fragment.iri(createVertexId("http://example.com/thing"))).toEqual(
      "<http://example.com/thing>",
    );
  });

  it("should accept an edge ID", () => {
    expect(fragment.iri(createEdgeId("http://example.com/e1"))).toEqual(
      "<http://example.com/e1>",
    );
  });

  it("should throw when the value is not a string, since an IRI is text", () => {
    expect(() => fragment.iri(createVertexId(124))).toThrow(
      UnsupportedValueTypeError,
    );
  });
});
