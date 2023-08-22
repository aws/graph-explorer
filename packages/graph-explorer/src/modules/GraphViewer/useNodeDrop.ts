import { useDrop } from "react-dnd";
import type { Vertex } from "../../@types/entities";
import { useFetchNode } from "../../hooks";

const useNodeDrop = () => {
  const fetchNode = useFetchNode();

  const [{ isOver, canDrop }, dropAreaRef] = useDrop<
    Vertex & { type: string },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: ["graph-viewer__node"],
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: false }),
      canDrop: monitor.canDrop(),
    }),
    drop: node => {
      fetchNode(node, 0);
    },
  });

  return {
    dropAreaRef,
    canDrop,
    isOver,
  };
};

export default useNodeDrop;
