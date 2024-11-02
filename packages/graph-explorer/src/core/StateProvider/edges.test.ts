import {
  createRandomEdge,
  renderHookWithRecoilRoot,
  createRandomVertex,
} from "@/utils/testing";
import { useRecoilState, useRecoilValue } from "recoil";
import { edgesAtom, edgesSelector, toEdgeMap } from "./edges";
import { act } from "@testing-library/react";

describe("edgeSelector", () => {
  it("should return edges", () => {
    const edge1 = createRandomEdge(createRandomVertex(), createRandomVertex());
    const edge2 = createRandomEdge(createRandomVertex(), createRandomVertex());
    const edge3 = createRandomEdge(createRandomVertex(), createRandomVertex());

    const { result } = renderHookWithRecoilRoot(
      () => useRecoilValue(edgesSelector),
      snapshot => {
        snapshot.set(edgesAtom, toEdgeMap([edge1, edge2, edge3]));
      }
    );

    expect(result.current.get(edge1.id)).toEqual(edge1);
    expect(result.current.get(edge2.id)).toEqual(edge2);
    expect(result.current.get(edge3.id)).toEqual(edge3);
  });

  it("should add new edges", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    const { result } = renderHookWithRecoilRoot(() => {
      const [value, set] = useRecoilState(edgesSelector);
      return { value, set };
    });

    act(() => result.current.set(toEdgeMap([edge])));

    expect(result.current.value.get(edge.id)).toEqual(edge);
  });
});
