import { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { BadgeRenderer } from "../../components/Graph/hooks/useRenderBadges";
import { useConfiguration } from "../../core";
import { nodesAtom } from "../../core/StateProvider/nodes";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import useNodeCounts from "../../hooks/useNodeCounts";

const useNodeBadges = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const getDisplayNames = useDisplayNames();
  const nodes = useRecoilValue(nodesAtom);
  const nodeCountsMap = useNodeCounts();

  const nodesCurrentNames = useMemo(() => {
    return nodes.reduce(
      (names, node) => {
        const vtConfig = config?.getVertexTypeConfig(node.data.type);
        const { name } = getDisplayNames(node);
        names[node.data.id] = {
          name,
          title: vtConfig?.displayLabel || textTransform(node.data.type),
        };
        return names;
      },
      {} as Record<string, { name: string; title: string }>
    );
  }, [config, getDisplayNames, nodes, textTransform]);

  return useCallback(
    (outOfFocusIds: Set<string>): BadgeRenderer =>
      (nodeData, boundingBox, { zoomLevel }) => {
        // Ensure we have the node name and title
        const name = nodesCurrentNames[nodeData.id]?.name ?? "";
        const title = nodesCurrentNames[nodeData.id]?.title ?? "";

        // Render the collapsed neighbor counts
        const nodeCounts = nodeCountsMap.get(nodeData.id);
        const countBadge = (() => {
          if (!nodeCounts || nodeCounts.isError) {
            return "";
          }
          if (nodeCounts.isLoading) {
            return "-";
          }
          // Hide the badge if the collapsed count is zero
          if (!nodeCounts.data || nodeCounts.data.collapsedCount <= 0) {
            return "";
          }
          return String(nodeCounts.data.collapsedCount);
        })();

        return [
          {
            text: name,
            hidden: zoomLevel === "small" || outOfFocusIds.has(nodeData.id),
            title: zoomLevel === "large" ? title : undefined,
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
              !countBadge,
            text: countBadge,
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
    [nodeCountsMap, nodesCurrentNames]
  );
};

export default useNodeBadges;
