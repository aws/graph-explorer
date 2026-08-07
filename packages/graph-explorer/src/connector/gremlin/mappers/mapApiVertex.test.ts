import {
  createRandomBoolean,
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

import { createVertexType } from "@/core";
import {
  createGDate,
  createGDouble,
  createGInt32,
  createGVertex,
  createGVertexProperty,
  createTestableVertex,
} from "@/utils/testing";

import mapApiVertex from "./mapApiVertex";

describe("mapApiVertex", () => {
  it("should map a graphSON vertex to a vertex", () => {
    const vertex = createTestableVertex().asResult();
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toStrictEqual(vertex);
  });

  it("should map a properties to Vertex attributes", () => {
    const vertex = createTestableVertex().asResult();
    const gVertex = createGVertex(vertex);
    const expectedProperties = {
      stringValue: createRandomName("stringValue"),
      integerValue: createRandomInteger(),
      doubleValue: createRandomDouble(),
      booleanValue: createRandomBoolean(),
      dateValue: createRandomDate(),
    };
    gVertex["@value"].properties = {
      stringValue: [
        createGVertexProperty("stringValue", expectedProperties.stringValue),
      ],
      integerValue: [
        createGVertexProperty(
          "integerValue",
          createGInt32(expectedProperties.integerValue),
        ),
      ],
      doubleValue: [
        createGVertexProperty(
          "doubleValue",
          createGDouble(expectedProperties.doubleValue),
        ),
      ],
      booleanValue: [
        createGVertexProperty("booleanValue", expectedProperties.booleanValue),
      ],
      dateValue: [
        createGVertexProperty(
          "dateValue",
          createGDate(expectedProperties.dateValue),
        ),
      ],
    };

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex.attributes).toStrictEqual({
      ...expectedProperties,
    });
  });

  it("should map a graphSON vertex to a fragment", () => {
    const vertex = createTestableVertex().asFragmentResult();
    const gVertex = createGVertex(vertex);
    delete gVertex["@value"].properties;

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toStrictEqual(vertex);
  });

  it("splits a Neptune composite label into separate types", () => {
    const vertex = createTestableVertex().asResult();
    vertex.types = [createVertexType("country"), createVertexType("capital")];
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex.types).toStrictEqual(["country", "capital"]);
  });

  it("maps an empty label to no types", () => {
    const vertex = createTestableVertex().asResult();
    vertex.types = [];
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toStrictEqual(vertex);
    expect(mappedVertex.types).toStrictEqual([]);
  });

  it("should map a graphSON vertex with name", () => {
    const name = createRandomName("vertexName");
    const vertex = createTestableVertex().asResult(name);
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex, name);

    expect(mappedVertex).toStrictEqual(vertex);
  });
});
