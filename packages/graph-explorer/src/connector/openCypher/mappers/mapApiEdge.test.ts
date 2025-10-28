import { createResultEdge } from "@/connector/entities";
import mapApiEdge from "./mapApiEdge";
import type { OCEdge } from "../types";
import { createTestableEdge, mapToOcEdge } from "@/utils/testing";
import {
  createRandomName,
  createRandomInteger,
  createRandomBoolean,
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
    const result = mapApiEdge(input);

    expect(result).toStrictEqual(
      createResultEdge({
        id: "",
        type: "",
        sourceId: "",
        targetId: "",
        attributes: {},
      })
    );
  });

  it("should map an edge", () => {
    const edge = createTestableEdge().asResult();

    const dateValue = createRandomDate();
    const input = {
      "~entityType": "relationship",
      "~id": String(edge.id),
      "~type": edge.type,
      "~start": String(edge.sourceId),
      "~end": String(edge.targetId),
      "~properties": {
        stringValue: createRandomName("stringValue"),
        integerValue: createRandomInteger(),
        booleanValue: createRandomBoolean(),
        doubleValue: createRandomDouble(),
        dateValue: dateValue.toISOString(),
      },
    } satisfies OCEdge;

    edge.attributes = { ...input["~properties"], dateValue };

    const result = mapApiEdge(input);

    expect(result).toStrictEqual(edge);
  });

  it("should map an edge with name", () => {
    const name = createRandomName("edgeName");
    const edge = createTestableEdge().asResult(name);
    const input = mapToOcEdge(edge);

    const result = mapApiEdge(input, name);

    expect(result).toStrictEqual(edge);
  });
});
