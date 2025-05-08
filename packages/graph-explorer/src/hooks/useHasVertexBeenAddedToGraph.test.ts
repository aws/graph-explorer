import { createRandomVertex, renderHookWithJotai } from "@/utils/testing";
import { useHasVertexBeenAddedToGraph } from "./useHasVertexBeenAddedToGraph";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  toNodeMap,
} from "@/core";

test("returns false if vertex has not been added to graph", () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithJotai(() =>
    useHasVertexBeenAddedToGraph(vertex.id)
  );

  expect(result.current).toBe(false);
});

test("returns true if vertex has been added to graph", () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithJotai(
    () => useHasVertexBeenAddedToGraph(vertex.id),
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex]));
    }
  );

  expect(result.current).toBe(true);
});

test("returns true if vertex has been added to graph and is filtered out by id", () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithJotai(
    () => useHasVertexBeenAddedToGraph(vertex.id),
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex]));
      snapshot.set(nodesFilteredIdsAtom, new Set([vertex.id]));
    }
  );

  expect(result.current).toBe(true);
});

test("returns true if vertex has been added to graph and is filtered out by type", () => {
  const vertex = createRandomVertex();
  const { result } = renderHookWithJotai(
    () => useHasVertexBeenAddedToGraph(vertex.id),
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex]));
      snapshot.set(nodesTypesFilteredAtom, new Set([vertex.type]));
    }
  );

  expect(result.current).toBe(true);
});
