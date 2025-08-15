import {
  createRandomEdge,
  createRandomEdgeId,
  FakeExplorer,
} from "@/utils/testing";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { createQueryClient } from "@/core/queryClient";

describe("edgeDetailsQuery", () => {
  it("should return null when edge is not found", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      edgeDetailsQuery(createRandomEdgeId())
    );

    expect(result.edge).toBeNull();
    expect(edgeDetailsSpy).toBeCalledTimes(1);
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();
    explorer.addEdge(edge);

    const result = await queryClient.fetchQuery(edgeDetailsQuery(edge.id));

    expect(result.edge).toStrictEqual(edge);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
  });
});
