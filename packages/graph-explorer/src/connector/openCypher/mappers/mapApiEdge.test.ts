import { createEdge, createVertex, Edge } from "@/core";
import mapApiEdge from "./mapApiEdge";
import { OCEdge } from "../types";
import { createRandomEdge, mapToOcEdge } from "@/utils/testing";

describe("mapApiEdge", () => {
  it("should map an empty edge", () => {
    const input = {
      "~entityType": "relationship",
      "~id": "",
      "~type": "",
      "~start": "",
      "~end": "",
      "~properties": {},
    } satisfies OCEdge;
    const result = mapApiEdge(input, [], []);

    expect(result).toEqual(
      createEdge({
        id: "",
        type: "",
        source: { id: "", types: [] },
        target: { id: "", types: [] },
        attributes: {},
      })
    );
  });

  it("should map an edge", () => {
    const edge = createRandomEdge();
    const input = mapToOcEdge(edge);

    const result = mapApiEdge(input, edge.source.types, edge.target.types);

    expect(result).toStrictEqual({
      ...edge,
      source: createVertex({
        id: edge.source.id,
        types: edge.source.types,
      }),
      target: createVertex({
        id: edge.target.id,
        types: edge.target.types,
      }),
    } satisfies Edge);
  });
});
