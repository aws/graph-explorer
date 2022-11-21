import { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { BadgeRenderer } from "../../components/Graph/hooks/useRenderBadges";
import { useConfiguration } from "../../core";
import { nodesAtom } from "../../core/StateProvider/nodes";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";

const useNodeBadges = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const getDisplayNames = useDisplayNames();
  const nodes = useRecoilValue(nodesAtom);

  const nodesCurrentNames = useMemo(() => {
    return nodes.reduce((names, node) => {
      const vtConfig = config?.getVertexTypeConfig(node.data.type);
      const { name } = getDisplayNames(node);
      names[node.data.id] = {
        name,
        title: vtConfig?.displayLabel || textTransform(node.data.type),
      };
      return names;
    }, {} as Record<string, { name: string; title: string }>);
  }, [config, getDisplayNames, nodes, textTransform]);

  return useCallback(
    (outOfFocusIds: Set<string>): BadgeRenderer => (
      nodeData,
      boundingBox,
      { zoomLevel }
    ) => {
      return [
        {
          text: nodesCurrentNames[nodeData.id].name,
          hidden: zoomLevel === "small" || outOfFocusIds.has(nodeData.id),
          title:
            zoomLevel === "large"
              ? nodesCurrentNames[nodeData.id].title
              : undefined,
          maxWidth: zoomLevel === "large" ? 80 : 50,
          anchor: "center",
          fontSize: 7,
          borderRadius: 2,
          backgroundColor: "rgba(29,37,49,0.6)",
          paddingLeft: 2,
          paddingRight: 2,
          paddingBottom: 2,
          paddingTop: 2,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height - 6,
            width: "auto",
            height: "auto",
          },
        },
        {
          hidden:
            zoomLevel === "small" ||
            outOfFocusIds.has(nodeData.id) ||
            !nodeData.__unfetchedNeighborCount,
          text: String(nodeData.__unfetchedNeighborCount),
          anchor: "center",
          fontSize: 5,
          borderRadius: 4,
          backgroundColor: "rgba(29,37,49,0.6)",
          paddingLeft: 3,
          paddingRight: 3,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y - 6,
            width: "auto",
            height: "auto",
          },
        },
      ];
    },
    [nodesCurrentNames]
  );
};

export default useNodeBadges;
