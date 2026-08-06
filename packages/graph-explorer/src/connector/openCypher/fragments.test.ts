import fc from "fast-check";

import { createEdgeId, createVertexId } from "@/core";

import {
  UnrepresentableStringError,
  UnsupportedValueTypeError,
} from "../queryValueError";
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

  it("should escape a backslash", () => {
    expect(fragment.string("te\\st")).toEqual('"te\\\\st"');
  });

  it("should escape a control character", () => {
    expect(fragment.string("a\nb")).toEqual('"a\\nb"');
  });

  it("should round-trip arbitrary strings through the literal", () => {
    fc.assert(
      fc.property(fc.string(), value => {
        fc.pre(value.isWellFormed() && !value.includes("\0"));
        expect(JSON.parse(fragment.string(value))).toBe(value);
      }),
    );
  });
});

describe("fragment.identifier", () => {
  it("should wrap the name in backticks", () => {
    expect(fragment.identifier("airport")).toEqual("`airport`");
  });

  it("should preserve spaces in the name", () => {
    expect(fragment.identifier("home airport")).toEqual("`home airport`");
  });
});

describe("fragment.id", () => {
  it("should wrap a string ID in double quotes", () => {
    expect(fragment.id(createVertexId("124"))).toEqual('"124"');
  });

  it("should accept an edge ID", () => {
    expect(fragment.id(createEdgeId("e1"))).toEqual('"e1"');
  });

  it("should throw for a numeric ID, which openCypher does not support", () => {
    expect(() => fragment.id(createVertexId(124))).toThrow(
      new UnsupportedValueTypeError("openCypher", "id", createVertexId(124)),
    );
  });

  it("should escape a double quote in a string ID", () => {
    expect(fragment.id(createVertexId('1"2'))).toEqual('"1\\"2"');
  });

  it("should escape a backslash in a string ID", () => {
    expect(fragment.id(createVertexId("1\\2"))).toEqual('"1\\\\2"');
  });

  it("should reject an unrepresentable string ID via the string guard", () => {
    expect(() => fragment.id(createVertexId("a\0b"))).toThrow(
      new UnrepresentableStringError("a\0b"),
    );
  });
});
