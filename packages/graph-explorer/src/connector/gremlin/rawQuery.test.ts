import { describe, expect, it, vi } from "vite-plus/test";

import { rawQuery } from "./rawQuery";

describe("gremlin rawQuery", () => {
  it("returns empty results without fetching for an empty query", async () => {
    const mockFetch = vi.fn();

    const result = await rawQuery(mockFetch, { query: "" });

    expect(result).toStrictEqual({ results: [], rawResponse: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends the query text exactly as given", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      requestId: "",
      status: { message: "", code: 200 },
      result: { data: { "@type": "g:List", "@value": [] } },
    });

    await rawQuery(mockFetch, { query: "\n  g.V()  \n\n  .limit(1)\n" });

    expect(mockFetch).toHaveBeenCalledWith("\n  g.V()  \n\n  .limit(1)\n");
  });
});
