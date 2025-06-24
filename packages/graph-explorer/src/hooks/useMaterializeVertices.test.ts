import {
  createRandomVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { toNodeMap } from "@/core";
import { useMaterializeVertices } from "./useMaterializeVertices";
import { cloneDeep } from "lodash";

test("should return vertex when already materialized", async () => {
  const dbState = new DbState();
  const { result } = renderHookWithState(
    () => useMaterializeVertices(),
    dbState
  );

  const vertex = createRandomVertex();
  vertex.__isFragment = false;
  const nodeMap = toNodeMap([vertex]);

  const actual = await result.current(nodeMap);

  expect(actual).toEqual(nodeMap);
  expect(dbState.explorer.vertexDetails).not.toBeCalled();
});

test("should fetch vertex details when fragment", async () => {
  const dbState = new DbState();
  const { result } = renderHookWithState(
    () => useMaterializeVertices(),
    dbState
  );

  const vertex = createRandomVertex();
  const expectedVertex = cloneDeep(vertex);

  vertex.__isFragment = true;
  vertex.attributes = {};

  vi.mocked(dbState.explorer.vertexDetails).mockResolvedValue({
    vertex: expectedVertex,
  });

  const actual = await result.current(toNodeMap([vertex]));

  expect(actual).toEqual(toNodeMap([expectedVertex]));
  expect(dbState.explorer.vertexDetails).toBeCalledTimes(1);
});
