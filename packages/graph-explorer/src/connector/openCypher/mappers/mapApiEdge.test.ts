import { createEdge } from "@/core";
import mapApiEdge from "./mapApiEdge";
import { OCEdge } from "../types";
import { createRandomEdge, createRandomVertex } from "@/utils/testing";
import {
  createRandomName,
  createRandomInteger,
  createRandomDouble,
  createRandomDate,
} from "@shared/utils/testing";

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
    const sourceVertex = createRandomVertex();
    const targetVertex = createRandomVertex();
    const edge = createRandomEdge(sourceVertex, targetVertex);

    const input = {
      "~entityType": "relationship",
      "~id": String(edge.id),
      "~type": edge.type,
      "~start": String(edge.source),
      "~end": String(edge.target),
      "~properties": {
        stringValue: createRandomName("stringValue"),
        integerValue: createRandomInteger(),
        doubleValue: createRandomDouble(),
        dateValue: createRandomDate().toISOString(),
      },
    } satisfies OCEdge;

    edge.attributes = input["~properties"];

    const result = mapApiEdge(input, sourceVertex.types, targetVertex.types);

    expect(result).toEqual(edge);
  });
});
