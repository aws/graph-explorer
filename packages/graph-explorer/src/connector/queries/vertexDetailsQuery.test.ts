import {
  createRandomVertex,
  createRandomVertexId,
  FakeExplorer,
} from "@/utils/testing";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { createQueryClient } from "@/core/queryClient";

describe("vertexDetailsQuery", () => {
  it("should return null when vertex is not found", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      vertexDetailsQuery(createRandomVertexId())
    );

    expect(result.vertex).toBeNull();
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    const result = await queryClient.fetchQuery(vertexDetailsQuery(vertex.id));

    expect(result.vertex).toEqual(vertex);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });
});
