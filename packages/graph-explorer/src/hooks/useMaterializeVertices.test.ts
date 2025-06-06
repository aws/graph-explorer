import {
  createMockExplorer,
  createRandomVertex,
  renderHookWithJotai,
} from "@/utils/testing";
import { explorerForTestingAtom, toNodeMap } from "@/core";
import { useMaterializeVertices } from "./useMaterializeVertices";
import { cloneDeep } from "lodash";

test("should return vertex when already materialized", async () => {
  const explorer = createMockExplorer();
  const { result } = renderHookWithJotai(
    () => useMaterializeVertices(),
    snapshot => {
      snapshot.set(explorerForTestingAtom, explorer);
    }
  );

  const vertex = createRandomVertex();
  vertex.__isFragment = false;
  const nodeMap = toNodeMap([vertex]);

  const actual = await result.current(nodeMap);

  expect(actual).toEqual(nodeMap);
  expect(explorer.vertexDetails).not.toBeCalled();
});

test("should fetch vertex details when fragment", async () => {
  const explorer = createMockExplorer();
  const { result } = renderHookWithJotai(
    () => useMaterializeVertices(),
    snapshot => {
      snapshot.set(explorerForTestingAtom, explorer);
    }
  );

  const vertex = createRandomVertex();
  const expectedVertex = cloneDeep(vertex);

  vertex.__isFragment = true;
  vertex.attributes = {};

  vi.mocked(explorer.vertexDetails).mockResolvedValue({
    vertex: expectedVertex,
  });

  const actual = await result.current(toNodeMap([vertex]));

  expect(actual).toEqual(toNodeMap([expectedVertex]));
  expect(explorer.vertexDetails).toBeCalledTimes(1);
});
