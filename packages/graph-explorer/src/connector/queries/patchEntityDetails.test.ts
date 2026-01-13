import { createQueryClient } from "@/core/queryClient";
import {
  createTestableEdge,
  createTestableVertex,
  FakeExplorer,
} from "@/utils/testing";

import {
  createPatchedResultBundle,
  createResultBundle,
  createResultScalar,
} from "../entities";
import { patchEntityDetails } from "./patchEntityDetails";

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

  it("should patch a simple bundle with scalars", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const scalar1 = createResultScalar({ name: "name", value: "John" });
    const scalar2 = createResultScalar({ name: "age", value: 25 });
    const bundle = createResultBundle({
      name: "UserInfo",
      values: [scalar1, scalar2],
    });

    const result = await patchEntityDetails(client, [bundle]);

    const expectedBundle = createPatchedResultBundle({
      name: "UserInfo",
      values: [scalar1, scalar2], // Scalars don't change during patching
    });

    expect(result).toStrictEqual([expectedBundle]);
  });

  it("should patch a bundle with vertices and edges", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const vertex = createTestableVertex();
    const edge = createTestableEdge();
    const scalar = createResultScalar({ name: "count", value: 1 });

    // Add the vertex and edge (addTestableEdge automatically adds source/target vertices)
    explorer.addTestableVertex(vertex);
    explorer.addTestableEdge(edge);

    const bundle = createResultBundle({
      name: "GraphData",
      values: [
        vertex.asFragmentResult("user"),
        edge.asFragmentResult("connection"),
        scalar,
      ],
    });

    const result = await patchEntityDetails(client, [bundle]);

    const expectedBundle = createPatchedResultBundle({
      name: "GraphData",
      values: [
        vertex.asPatchedResult("user"),
        edge.asPatchedResult("connection"),
        scalar,
      ],
    });

    expect(result).toStrictEqual([expectedBundle]);
  });

  it("should patch nested bundles", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const vertex = createTestableVertex();
    explorer.addTestableVertex(vertex);

    const innerBundle = createResultBundle({
      name: "InnerData",
      values: [
        vertex.asFragmentResult("innerVertex"),
        createResultScalar({ name: "innerValue", value: "test" }),
      ],
    });

    const outerBundle = createResultBundle({
      name: "OuterData",
      values: [
        createResultScalar({ name: "outerValue", value: 42 }),
        innerBundle,
      ],
    });

    const result = await patchEntityDetails(client, [outerBundle]);

    const expectedInnerBundle = createPatchedResultBundle({
      name: "InnerData",
      values: [
        vertex.asPatchedResult("innerVertex"),
        createResultScalar({ name: "innerValue", value: "test" }),
      ],
    });

    const expectedOuterBundle = createPatchedResultBundle({
      name: "OuterData",
      values: [
        createResultScalar({ name: "outerValue", value: 42 }),
        expectedInnerBundle,
      ],
    });

    expect(result).toStrictEqual([expectedOuterBundle]);
  });

  it("should patch empty bundle", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const bundle = createResultBundle({
      name: "EmptyBundle",
      values: [],
    });

    const result = await patchEntityDetails(client, [bundle]);

    const expectedBundle = createPatchedResultBundle({
      name: "EmptyBundle",
      values: [],
    });

    expect(result).toStrictEqual([expectedBundle]);
  });

  it("should patch bundle without name", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const vertex = createTestableVertex();
    explorer.addTestableVertex(vertex);

    const bundle = createResultBundle({
      values: [
        vertex.asFragmentResult(),
        createResultScalar({ value: "anonymous" }),
      ],
    });

    const result = await patchEntityDetails(client, [bundle]);

    const expectedBundle = createPatchedResultBundle({
      values: [
        vertex.asPatchedResult(),
        createResultScalar({ value: "anonymous" }),
      ],
    });

    expect(result).toStrictEqual([expectedBundle]);
  });
});
