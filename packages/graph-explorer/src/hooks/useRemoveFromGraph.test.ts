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
  useRemoveEdgeFromGraph,
  useRemoveNodeFromGraph,
} from "./useRemoveFromGraph";
import { edgesAtom, toEdgeMap } from "@/core/StateProvider/edges";

test("should remove one node", async () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveNodeFromGraph(vertex.id);
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  expect(result.current.entities.nodes.has(vertex.id)).toBeFalsy();
});

test("should remove one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveEdgeFromGraph(edge.id);
      const [entities] = useEntities();

      return { callback, entities };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
      snapshot.set(edgesAtom, toEdgeMap([edge]));
    }
  );

  await act(async () => {
    result.current.callback();
  });

  expect(result.current.entities.edges.has(edge.id)).toBeFalsy();
});
