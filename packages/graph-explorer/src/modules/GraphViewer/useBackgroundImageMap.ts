import { type VertexTypeConfig } from "@/core";
import { useQueries } from "@tanstack/react-query";
import { renderNode } from "./renderNode";

/**
 * Generates appropriate background images from vertex type configurations,
 * considering the image type and applying colors for SVG icons.
 *
 * @param vtConfigs - Array of vertex type configurations containing styling and
 * display information
 * @returns A Map where keys are vertex type names and values are their
 * corresponding background image strings
 */
export function useBackgroundImageMap(vtConfigs: VertexTypeConfig[]) {
  return useQueries({
    queries: vtConfigs.map(vtConfig => ({
      queryKey: ["vertexIcon", vtConfig],
      queryFn: async ({ client }) => {
        const backgroundImage = await renderNode(client, vtConfig);
        return { backgroundImage, type: vtConfig.type };
      },
    })),
    combine: results =>
      results.reduce((map, item) => {
        if (item.data != null && item.data.backgroundImage != null) {
          map.set(item.data.type, item.data.backgroundImage);
        }
        return map;
      }, new Map<string, string>()),
  });
}
