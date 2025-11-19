import {
  createGDate,
  createGDouble,
  createGInt32,
  createGVertex,
  createGVertexProperty,
  createTestableVertex,
} from "@/utils/testing";
import mapApiVertex from "./mapApiVertex";
import {
  createRandomBoolean,
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

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

  it("should map a graphSON vertex without labels", () => {
    const vertex = createTestableVertex().asResult();
    vertex.types = [];
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toStrictEqual(vertex);
  });

  it("should map a graphSON vertex with name", () => {
    const name = createRandomName("vertexName");
    const vertex = createTestableVertex().asResult(name);
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex, name);

    expect(mappedVertex).toStrictEqual(vertex);
  });
});
