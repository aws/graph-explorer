/* eslint-disable @typescript-eslint/require-await */
import {
  createRandomEdge,
  createRandomVertex,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import useEntities from "./useEntities";
import { act } from "react";
import { nodesAtom, toNodeMap } from "@/core/StateProvider/nodes";
import {
  useClearGraph,
  useRemoveEdgeFromGraph,
  useRemoveNodeFromGraph,
} from "./useRemoveFromGraph";
import { edgesAtom, toEdgeMap } from "@/core/StateProvider/edges";
import { createArray } from "@shared/utils/testing";

test("should remove one node", async () => {
  const vertex = createRandomVertex();
  const noise = createArray(10, createRandomVertex);
  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveNodeFromGraph(vertex.id);
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex, ...noise]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  expect(result.current.entities.nodes.has(vertex.id)).toBeFalsy();
  expect(result.current.entities.nodes.size).toBe(noise.length);
});

test("should remove one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge1 = createRandomEdge(node1, node2);
  const edge2 = createRandomEdge(node2, node1);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveEdgeFromGraph(edge1.id);
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
      snapshot.set(edgesAtom, toEdgeMap([edge1, edge2]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  expect(result.current.entities.edges.has(edge1.id)).toBeFalsy();
  expect(result.current.entities.edges.has(edge2.id)).toBeTruthy();
  expect(result.current.entities.nodes.size).toBe(2);
});

test("should remove all nodes and edges", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge1 = createRandomEdge(node1, node2);
  const edge2 = createRandomEdge(node2, node1);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useClearGraph();
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
      snapshot.set(edgesAtom, toEdgeMap([edge1, edge2]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  expect(result.current.entities.nodes.size).toBe(0);
  expect(result.current.entities.edges.size).toBe(0);
});
