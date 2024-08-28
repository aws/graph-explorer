import {
  createRandomEdge,
  renderHookWithRecoilRoot,
  createRandomVertex,
} from "@/utils/testing";
import { useRecoilState, useRecoilValue } from "recoil";
import { edgesAtom, edgesSelector } from "./edges";
import { act } from "@testing-library/react";

describe("edgeSelector", () => {
  it("should return edges", () => {
    const edge1 = createRandomEdge(createRandomVertex(), createRandomVertex());
    const edge2 = createRandomEdge(createRandomVertex(), createRandomVertex());
    const edge3 = createRandomEdge(createRandomVertex(), createRandomVertex());

    const { result } = renderHookWithRecoilRoot(
      () => useRecoilValue(edgesSelector),
      snapshot => {
        snapshot.set(edgesAtom, [edge1, edge2, edge3]);
      }
    );

    expect(result.current).toContainEqual(edge1);
    expect(result.current).toContainEqual(edge2);
    expect(result.current).toContainEqual(edge3);
  });

  it("should add new edges", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    const { result } = renderHookWithRecoilRoot(() => {
      const [value, set] = useRecoilState(edgesSelector);
      return { value, set };
    });

    act(() => result.current.set([edge]));

    expect(result.current.value).toContainEqual(edge);
  });
});
