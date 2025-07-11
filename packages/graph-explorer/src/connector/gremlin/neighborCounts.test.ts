import { createVertexId } from "@/core";
import { neighborCounts } from "./neighborCounts";
import { query } from "@/utils";

describe("neighborCounts", () => {
  it("Should return a template for the given vertex id", async () => {
    const mockFetch = vi.fn();

    await neighborCounts(mockFetch, {
      vertexIds: [createVertexId("12")],
    }).catch(() => null);

    expect(mockFetch).toHaveBeenCalledWith(query`
      g.V("12")
       .group()
       .by(id)
       .by(
         both().dedup().group().by(label).by(count())
       )
    `);
  });

  it("Should return a template for the given vertex id with number type", async () => {
    const mockFetch = vi.fn();

    await neighborCounts(mockFetch, {
      vertexIds: [createVertexId(12)],
    }).catch(() => null);

    expect(mockFetch).toHaveBeenCalledWith(query`
      g.V(12L)
       .group()
       .by(id)
       .by(
         both().dedup().group().by(label).by(count())
       )
    `);
  });
});
