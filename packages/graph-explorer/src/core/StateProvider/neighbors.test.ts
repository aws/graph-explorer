import { VertexId } from "@/@types/entities";
import { calculateNeighbors } from "./neighbors";

describe("calculateNeighbors", () => {
  it("should calculate neighbors correctly", () => {
    const total = {
      total: 10,
      byType: new Map([
        ["type1", 6],
        ["type2", 4],
      ]),
    };
    const fetchedNeighbors = [
      { id: "1" as VertexId, type: "type1" },
      { id: "2" as VertexId, type: "type2" },
      { id: "3" as VertexId, type: "type1" },
      { id: "4" as VertexId, type: "type2" },
    ];

    const result = calculateNeighbors(
      total.total,
      total.byType,
      fetchedNeighbors
    );

    expect(result.all).toEqual(total.total);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(6);
    expect(result.byType).toEqual(
      new Map([
        ["type1", { all: 6, fetched: 2, unfetched: 4 }],
        ["type2", { all: 4, fetched: 2, unfetched: 2 }],
      ])
    );
  });
});
