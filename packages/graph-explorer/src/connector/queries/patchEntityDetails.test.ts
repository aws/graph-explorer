import {
  createRandomEdge,
  createRandomVertex,
  FakeExplorer,
  makeFragment,
} from "@/utils/testing";
import { patchEntityDetails } from "./patchEntityDetails";
import { createScalar } from "@/core";
import { createQueryClient } from "@/core/queryClient";

describe("patchEntityDetails", () => {
  it("should return empty array", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const result = await patchEntityDetails(client, []);
    expect(result).toEqual([]);
  });

  it("should return given entities", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const entities = [
      createRandomVertex(),
      createRandomEdge(createRandomVertex(), createRandomVertex()),
      createScalar({ name: "scalar", value: 42 }),
    ];
    const result = await patchEntityDetails(client, entities);
    expect(result).toEqual(entities);
  });

  it("should return given vertex with updated details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);
    const entities = [makeFragment(vertex)];

    const result = await patchEntityDetails(client, entities);

    expect(result).toEqual([vertex]);
  });

  it("should return given edge with updated details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });

    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);
    explorer.addEdge(edge);
    explorer.addVertex(source);
    explorer.addVertex(target);
    const entities = [makeFragment(edge)];

    const result = await patchEntityDetails(client, entities);

    expect(result).toEqual([edge]);
  });
});
