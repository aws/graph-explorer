/* eslint-disable @typescript-eslint/require-await */
import {
  createRandomEdge,
  createRandomEntities,
  createRandomVertex,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { useAddToGraph } from "./useAddToGraph";
import useEntities from "./useEntities";
import { act } from "react";
import { nodesAtom, toNodeMap } from "@/core/StateProvider/nodes";

test("should add one node", async () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph(vertex);
    const [entities] = useEntities();

    return { callback, entities };
  });

  await act(async () => {
    result.current.callback();
  });

  const actual = result.current.entities.nodes.get(vertex.id);
  expect(actual).toEqual(vertex);
});

test("should add one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph(edge);
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  const actual = result.current.entities.edges.get(edge.id);
  expect(actual).toEqual(edge);
});

test("should add multiple nodes and edges", async () => {
  const randomEntities = createRandomEntities();
  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph(
      ...randomEntities.nodes.values(),
      ...randomEntities.edges.values()
    );
    const [entities] = useEntities();

    return { callback, entities };
  });

  await act(async () => {
    result.current.callback();
  });

  const actualNodes = result.current.entities.nodes.values().toArray();
  const expectedNodes = randomEntities.nodes.values().toArray();
  expect(actualNodes).toEqual(expectedNodes);

  const actualEdges = result.current.entities.edges.values().toArray();
  const expectedEdges = randomEntities.edges.values().toArray();
  expect(actualEdges).toEqual(expectedEdges);
});
