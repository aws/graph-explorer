import { describe, expect, it, vi } from "vite-plus/test";

import { rawQuery } from "./rawQuery";

describe("openCypher rawQuery", () => {
  it("returns empty results without fetching for an empty query", async () => {
    const mockFetch = vi.fn();

    const result = await rawQuery(mockFetch, { query: "" });

    expect(result).toStrictEqual({ results: [], rawResponse: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends the query text exactly as given", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ results: [] });

    await rawQuery(mockFetch, { query: "\n  MATCH (v)  \n\n  RETURN v\n" });

    expect(mockFetch).toHaveBeenCalledWith("\n  MATCH (v)  \n\n  RETURN v\n");
  });
});
