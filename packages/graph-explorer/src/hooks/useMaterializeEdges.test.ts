import {
  createRandomEdge,
  createRandomVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { toEdgeMap } from "@/core";
import { useMaterializeEdges } from "./useMaterializeEdges";
import { cloneDeep } from "lodash";

test("should return edge when already materialized", async () => {
  const dbState = new DbState();
  const { result } = renderHookWithState(() => useMaterializeEdges(), dbState);

  const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
  edge.__isFragment = false;
  const edgeMap = toEdgeMap([edge]);

  const actual = await result.current(edgeMap);

  expect(actual).toEqual(edgeMap);
});

test("should fetch edge details when fragment", async () => {
  const dbState = new DbState();
  const { result } = renderHookWithState(() => useMaterializeEdges(), dbState);

  const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
  const expectedEdge = cloneDeep(edge);

  edge.__isFragment = true;
  edge.attributes = {};

  vi.mocked(dbState.explorer.edgeDetails).mockResolvedValue({
    edge: expectedEdge,
  });

  const actual = await result.current(toEdgeMap([edge]));

  expect(actual).toEqual(toEdgeMap([expectedEdge]));
  expect(dbState.explorer.edgeDetails).toBeCalledTimes(1);
});
