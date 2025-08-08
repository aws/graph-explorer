import { createRandomEdge, createRandomVertex } from "@/utils/testing";
import { getAllEdges, getAllVertices } from "./entities";
import { createScalar } from "./scalar";

describe("entities", () => {
  describe("getAllVertices", () => {
    it("should return empty when given empty", () => {
      expect(getAllVertices([])).toEqual([]);
    });

    it("should return all vertices when given multiple vertices", () => {
      const vertices = [createRandomVertex(), createRandomVertex()];
      expect(getAllVertices(vertices)).toEqual(vertices);
    });

    it("should return all vertices when given multiple kinds of entities", () => {
      const vertices = [createRandomVertex(), createRandomVertex()];
      const entities = [
        ...vertices,
        createRandomEdge(createRandomVertex(), createRandomVertex()),
        createScalar({ name: "scalar", value: 42 }),
      ];
      expect(getAllVertices(entities)).toEqual(vertices);
    });
  });

  describe("getAllEdges", () => {
    it("should return empty when given empty", () => {
      expect(getAllEdges([])).toEqual([]);
    });

    it("should return all edges when given multiple edges", () => {
      const edges = [
        createRandomEdge(createRandomVertex(), createRandomVertex()),
        createRandomEdge(createRandomVertex(), createRandomVertex()),
      ];
      expect(getAllEdges(edges)).toEqual(edges);
    });

    it("should return all edges when given multiple kinds of entities", () => {
      const edges = [
        createRandomEdge(createRandomVertex(), createRandomVertex()),
        createRandomEdge(createRandomVertex(), createRandomVertex()),
      ];
      const entities = [
        ...edges,
        createRandomVertex(),
        createScalar({ name: "scalar", value: 42 }),
      ];
      expect(getAllEdges(entities)).toEqual(edges);
    });
  });
});
