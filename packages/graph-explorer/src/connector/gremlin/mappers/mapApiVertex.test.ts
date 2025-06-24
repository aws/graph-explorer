import {
  createGDate,
  createGDouble,
  createGInt32,
  createGVertex,
  createGVertexProperty,
  createRandomVertex,
} from "@/utils/testing";
import mapApiVertex from "./mapApiVertex";
import {
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

describe("mapApiVertex", () => {
  it("should map a graphSON vertex to a vertex", () => {
    const vertex = createRandomVertex();
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toEqual(vertex);
  });

  it("should map a properties to Vertex attributes", () => {
    const vertex = createRandomVertex();
    const gVertex = createGVertex(vertex);
    const expectedProperties = {
      stringValue: createRandomName("stringValue"),
      integerValue: createRandomInteger(),
      doubleValue: createRandomDouble(),
      dateValue: createRandomDate(),
    };
    gVertex["@value"].properties = {
      stringValue: [
        createGVertexProperty("stringValue", expectedProperties.stringValue),
      ],
      integerValue: [
        createGVertexProperty(
          "integerValue",
          createGInt32(expectedProperties.integerValue)
        ),
      ],
      doubleValue: [
        createGVertexProperty(
          "doubleValue",
          createGDouble(expectedProperties.doubleValue)
        ),
      ],
      dateValue: [
        createGVertexProperty(
          "dateValue",
          createGDate(expectedProperties.dateValue)
        ),
      ],
    };

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex.attributes).toEqual({
      ...expectedProperties,
      // Keeps dates as numbers
      dateValue: expectedProperties.dateValue.getTime(),
    });
  });

  it("should map a graphSON vertex to a fragment", () => {
    const vertex = createRandomVertex();
    vertex.__isFragment = true;
    vertex.attributes = {};
    const gVertex = createGVertex(vertex);
    delete gVertex["@value"].properties;

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toEqual(vertex);
  });

  it("should map a graphSON vertex without labels", () => {
    const vertex = createRandomVertex();
    vertex.type = "";
    vertex.types = [];
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toEqual(vertex);
  });
});
