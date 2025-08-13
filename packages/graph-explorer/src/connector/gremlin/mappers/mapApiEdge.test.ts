import { createGEdge, createTestableEdge } from "@/utils/testing";
import mapApiEdge from "./mapApiEdge";
import { createRandomName } from "@shared/utils/testing";

describe("mapApiEdge", () => {
  it("should map a graphSON edge to an edge", () => {
    const edge = createTestableEdge().asResult();
    const gEdge = createGEdge(edge);

    const mappedEdge = mapApiEdge(gEdge);

    expect(mappedEdge).toEqual(edge);
  });

  it("should map a graphSON edge to a fragment", () => {
    const edge = createTestableEdge().asFragmentResult();
    const gEdge = createGEdge(edge);
    delete gEdge["@value"].properties;

    const mappedEdge = mapApiEdge(gEdge);

    expect(mappedEdge).toEqual(edge);
  });

  it("should map a graphSON edge with name", () => {
    const name = createRandomName("edgeName");
    const edge = createTestableEdge().asResult(name);
    const gEdge = createGEdge(edge);

    const mappedEdge = mapApiEdge(gEdge, name);

    expect(mappedEdge).toEqual(edge);
  });
});
