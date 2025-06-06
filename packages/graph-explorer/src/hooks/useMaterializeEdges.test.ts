import {
  createMockExplorer,
  createRandomEdge,
  createRandomVertex,
  renderHookWithJotai,
} from "@/utils/testing";
import { explorerForTestingAtom, toEdgeMap } from "@/core";
import { useMaterializeEdges } from "./useMaterializeEdges";
import { cloneDeep } from "lodash";

test("should return edge when already materialized", async () => {
  const explorer = createMockExplorer();
  const { result } = renderHookWithJotai(
    () => useMaterializeEdges(),
    snapshot => {
      snapshot.set(explorerForTestingAtom, explorer);
    }
  );

  const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
  edge.__isFragment = false;
  const edgeMap = toEdgeMap([edge]);

  const actual = await result.current(edgeMap);

  expect(actual).toEqual(edgeMap);
});

test("should fetch edge details when fragment", async () => {
  const explorer = createMockExplorer();
  const { result } = renderHookWithJotai(
    () => useMaterializeEdges(),
    snapshot => {
      snapshot.set(explorerForTestingAtom, explorer);
    }
  );

  const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
  const expectedEdge = cloneDeep(edge);

  edge.__isFragment = true;
  edge.attributes = {};

  vi.mocked(explorer.edgeDetails).mockResolvedValue({
    edge: expectedEdge,
  });

  const actual = await result.current(toEdgeMap([edge]));

  expect(actual).toEqual(toEdgeMap([expectedEdge]));
  expect(explorer.edgeDetails).toBeCalledTimes(1);
});
