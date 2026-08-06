import { createVertexId, type Vertex } from "@/core";
import { createTestableVertex } from "@/utils/testing";

import type { BlankNodeItem, BlankNodesMap } from "../types";

import { storedBlankNodeNeighborsRequest } from "./storedBlankNodeNeighborsRequest";

const blankNodeId = createVertexId("_:b0");

function blankNodesWithNeighbors(vertices: Vertex[]): BlankNodesMap {
  const item = {
    id: blankNodeId,
    subQueryTemplate: "",
    vertex: createTestableVertex().withRdfValues().asVertex(),
    neighborCounts: { totalCount: vertices.length, counts: new Map() },
    neighbors: { vertices, edges: [] },
  } satisfies BlankNodeItem;

  return new Map([[blankNodeId, item]]);
}

function airportWith(attributes: Record<string, string>) {
  return createTestableVertex()
    .withRdfValues()
    .with({ types: ["airport"], attributes })
    .asVertex();
}

describe("SPARQL > storedBlankNodeNeighborsRequest", () => {
  it("should return nothing when the blank node has no stored neighbors", async () => {
    const response = await storedBlankNodeNeighborsRequest(new Map(), {
      resourceURI: blankNodeId,
    });

    expect(response).toStrictEqual({ vertices: [], edges: [] });
  });

  it("should return every stored neighbor when no filters are given", async () => {
    const seattle = airportWith({ city: "Seattle" });
    const portland = airportWith({ city: "Portland" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle, portland]),
      { resourceURI: blankNodeId },
    );

    expect(response.vertices).toStrictEqual([seattle, portland]);
  });

  it("should keep only neighbors whose attribute contains the filter value", async () => {
    const seattle = airportWith({ city: "Seattle" });
    const portland = airportWith({ city: "Portland" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle, portland]),
      {
        resourceURI: blankNodeId,
        subjectClasses: ["airport"],
        attributeFilters: [{ name: "city", value: "Seat" }],
      },
    );

    expect(response.vertices).toStrictEqual([seattle]);
  });

  it("should match the attribute regardless of case", async () => {
    const seattle = airportWith({ city: "Seattle" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle]),
      {
        resourceURI: blankNodeId,
        attributeFilters: [{ name: "city", value: "sEAT" }],
      },
    );

    expect(response.vertices).toStrictEqual([seattle]);
  });

  it("should treat regex metacharacters in the filter value as literal text", async () => {
    const literal = airportWith({ city: "a.(b" });
    const resembling = airportWith({ city: "axyb" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([literal, resembling]),
      {
        resourceURI: blankNodeId,
        attributeFilters: [{ name: "city", value: "a.(b" }],
      },
    );

    expect(response.vertices).toStrictEqual([literal]);
  });

  it("should require every filter to match", async () => {
    const seattleWa = airportWith({ city: "Seattle", state: "WA" });
    const seattleOr = airportWith({ city: "Seattle", state: "OR" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattleWa, seattleOr]),
      {
        resourceURI: blankNodeId,
        subjectClasses: ["airport"],
        attributeFilters: [
          { name: "city", value: "Seattle" },
          { name: "state", value: "WA" },
        ],
      },
    );

    expect(response.vertices).toStrictEqual([seattleWa]);
  });

  it("should exclude neighbors missing the filtered attribute", async () => {
    const withCity = airportWith({ city: "Seattle" });
    const withoutCity = airportWith({ state: "WA" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([withCity, withoutCity]),
      {
        resourceURI: blankNodeId,
        subjectClasses: ["airport"],
        attributeFilters: [{ name: "city", value: "Seattle" }],
      },
    );

    expect(response.vertices).toStrictEqual([withCity]);
  });

  it("should exclude neighbors whose type is not requested", async () => {
    const airport = airportWith({ city: "Seattle" });
    const country = createTestableVertex()
      .withRdfValues()
      .with({ types: ["country"], attributes: { city: "Seattle" } })
      .asVertex();

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([airport, country]),
      {
        resourceURI: blankNodeId,
        subjectClasses: ["airport"],
        attributeFilters: [{ name: "city", value: "Seattle" }],
      },
    );

    expect(response.vertices).toStrictEqual([airport]);
  });

  it("should apply filters when no subject classes are requested", async () => {
    const seattle = airportWith({ city: "Seattle" });
    const portland = airportWith({ city: "Portland" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle, portland]),
      {
        resourceURI: blankNodeId,
        attributeFilters: [{ name: "city", value: "Seat" }],
      },
    );

    expect(response.vertices).toStrictEqual([seattle]);
  });

  it("should treat an empty subject class list as no type constraint", async () => {
    const seattle = airportWith({ city: "Seattle" });
    const portland = airportWith({ city: "Portland" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle, portland]),
      {
        resourceURI: blankNodeId,
        subjectClasses: [],
        attributeFilters: [{ name: "city", value: "Seat" }],
      },
    );

    expect(response.vertices).toStrictEqual([seattle]);
  });

  it("should limit the number of neighbors returned", async () => {
    const seattle = airportWith({ city: "Seattle" });
    const portland = airportWith({ city: "Portland" });

    const response = await storedBlankNodeNeighborsRequest(
      blankNodesWithNeighbors([seattle, portland]),
      { resourceURI: blankNodeId, limit: 1 },
    );

    expect(response.vertices).toStrictEqual([seattle]);
  });
});
