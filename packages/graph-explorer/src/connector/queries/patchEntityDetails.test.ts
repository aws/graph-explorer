import {
  createTestableEdge,
  createTestableVertex,
  FakeExplorer,
} from "@/utils/testing";
import { patchEntityDetails } from "./patchEntityDetails";
import { createResultScalar } from "@/core";
import { createQueryClient } from "@/core/queryClient";

describe("patchEntityDetails", () => {
  it("should return empty array", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const result = await patchEntityDetails(client, []);
    expect(result).toStrictEqual([]);
  });

  it("should return given vertex with updated details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const vertex = createTestableVertex();
    explorer.addTestableVertex(vertex);

    const result = await patchEntityDetails(client, [
      vertex.asFragmentResult(),
    ]);

    expect(result).toStrictEqual([vertex.asPatchedResult()]);
  });

  it("should return given edge with updated details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const edge = createTestableEdge();
    explorer.addTestableEdge(edge);

    const result = await patchEntityDetails(client, [edge.asFragmentResult()]);

    expect(result).toStrictEqual([edge.asPatchedResult()]);
  });

  it("should do nothing with scalars", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const scalar = createResultScalar({ name: "scalar", value: 42 });

    const result = await patchEntityDetails(client, [scalar]);

    expect(result).toStrictEqual([scalar]);
  });

  it("should return patched entities", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertex = createTestableVertex();
    const edge = createTestableEdge();
    const scalar = createResultScalar({ name: "scalar", value: 42 });
    explorer.addTestableVertex(vertex);
    explorer.addTestableEdge(edge);

    const result = await patchEntityDetails(client, [
      vertex.asResult(),
      edge.asResult(),
      scalar,
    ]);

    expect(result).toStrictEqual([
      vertex.asPatchedResult(),
      edge.asPatchedResult(),
      scalar,
    ]);
  });
});
