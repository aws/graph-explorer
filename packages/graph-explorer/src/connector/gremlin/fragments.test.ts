import { createEdgeId, createVertexId } from "@/core";

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

describe("fragment.identifier", () => {
  it("should wrap the name in double quotes", () => {
    expect(fragment.identifier("city")).toEqual('"city"');
  });

  it("should preserve spaces in the name", () => {
    expect(fragment.identifier("home city")).toEqual('"home city"');
  });

  it("should escape a double quote", () => {
    expect(fragment.identifier('ci"ty')).toEqual('"ci\\"ty"');
  });
});

describe("fragment.id", () => {
  it("should wrap a string ID in double quotes", () => {
    expect(fragment.id(createVertexId("124"))).toEqual('"124"');
  });

  it("should accept an edge ID", () => {
    expect(fragment.id(createEdgeId("e1"))).toEqual('"e1"');
  });

  it("should add the long suffix to a numeric ID", () => {
    expect(fragment.id(createVertexId(124))).toEqual("124L");
  });
});
