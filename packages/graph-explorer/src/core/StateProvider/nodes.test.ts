import { createRandomVertex, renderHookWithRecoilRoot } from "@/utils/testing";
import { useRecoilState, useRecoilValue } from "recoil";
import { nodesAtom, nodesSelector, toNodeMap } from "./nodes";
import { act } from "@testing-library/react";

describe("nodeSelector", () => {
  it("should return nodes", () => {
    const node1 = createRandomVertex();
    const node2 = createRandomVertex();
    const node3 = createRandomVertex();

    const { result } = renderHookWithRecoilRoot(
      () => useRecoilValue(nodesSelector),
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2, node3]));
      }
    );

    expect(result.current.get(node1.id)).toEqual(node1);
    expect(result.current.get(node2.id)).toEqual(node2);
    expect(result.current.get(node3.id)).toEqual(node3);
  });

  it("should add new nodes", () => {
    const node = createRandomVertex();

    const { result } = renderHookWithRecoilRoot(() => {
      const [value, set] = useRecoilState(nodesSelector);
      return { value, set };
    });

    act(() => result.current.set(toNodeMap([node])));

    expect(result.current.value.get(node.id)).toEqual(node);
  });
});
