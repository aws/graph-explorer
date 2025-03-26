import { createGVertex, createRandomVertex } from "@/utils/testing";
import mapApiVertex from "./mapApiVertex";

describe("mapApiVertex", () => {
  it("should map a graphSON vertex to a vertex", () => {
    const vertex = createRandomVertex();
    const gVertex = createGVertex(vertex);

    const mappedVertex = mapApiVertex(gVertex);

    expect(mappedVertex).toEqual(vertex);
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
