import { createRandomUrlString } from "@shared/utils/testing";

import { createVertexId } from "@/core";
import { query } from "@/utils";

import {
  getLimit,
  getNeighborsFilter,
  getSubjectClasses,
} from "./filterHelpers";

describe("getSubjectClasses", () => {
  it("should return empty string if no subject classes", () => {
    const result = getSubjectClasses([]);
    expect(result).toEqual("");
  });

  it("should create values with one class", () => {
    const result = getSubjectClasses(["http://example.org/class"]);
    expect(result).toEqual(`FILTER (?class IN (<http://example.org/class>))`);
  });

  it("should create values with multiple classes", () => {
    const result = getSubjectClasses([
      "http://example.org/class1",
      "http://example.org/class2",
    ]);
    expect(result).toEqual(
      `FILTER (?class IN (<http://example.org/class1>, <http://example.org/class2>))`,
    );
  });
});

describe("getNeighborsFilter", () => {
  it("should return basic filter when no excluded vertices", () => {
    const result = getNeighborsFilter();
    expect(result).toEqual(
      `FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)`,
    );
  });

  it("should return basic filter when excluded vertices set is empty", () => {
    const result = getNeighborsFilter(new Set());
    expect(result).toEqual(
      `FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)`,
    );
  });

  it("should include excluded vertices in filter", () => {
    const vertex1 = createVertexId(createRandomUrlString());
    const vertex2 = createVertexId(createRandomUrlString());
    const excludedVertices = new Set([vertex1, vertex2]);

    const result = getNeighborsFilter(excludedVertices);

    expect(result).toEqual(
      query`
        FILTER(
          !isLiteral(?neighbor) && 
          ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
          ?neighbor NOT IN (
            <${vertex1}>, 
            <${vertex2}>
          )
        )
      `,
    );
  });

  it("should handle single excluded vertex", () => {
    const vertex = createVertexId(createRandomUrlString());
    const excludedVertices = new Set([vertex]);

    const result = getNeighborsFilter(excludedVertices);

    expect(result).toEqual(
      query`
        FILTER(
          !isLiteral(?neighbor) && 
          ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
          ?neighbor NOT IN (
            <${vertex}>
          )
        )
      `,
    );
  });
});

describe("getLimit", () => {
  it("should return empty string if no offset", () => {
    const result = getLimit();
    expect(result).toEqual("");
  });

  it("should return empty string if no limit", () => {
    const result = getLimit(undefined);
    expect(result).toEqual("");
  });

  it("should return empty string if limit is 0", () => {
    const result = getLimit(0);
    expect(result).toEqual("");
  });

  it("should return limit", () => {
    const result = getLimit(10);
    expect(result).toEqual("LIMIT 10");
  });

  it("should return limit with no offset when zero", () => {
    const result = getLimit(10, 0);
    expect(result).toEqual("LIMIT 10");
  });

  it("should return limit with offset", () => {
    const result = getLimit(10, 5);
    expect(result).toEqual("LIMIT 10 OFFSET 5");
  });

  it("should return offset only when limit is zero", () => {
    const result = getLimit(0, 5);
    expect(result).toEqual("OFFSET 5");
  });

  it("should return offset only when limit is undefined", () => {
    const result = getLimit(undefined, 5);
    expect(result).toEqual("OFFSET 5");
  });
});
