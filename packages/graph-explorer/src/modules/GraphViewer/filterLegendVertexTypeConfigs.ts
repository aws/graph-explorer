import type {
  DisplayVertex,
  DisplayVertexTypeConfig,
  VertexType,
} from "@/core";

/**
 * Keeps legend rows only for vertex types that appear on at least one canvas vertex
 * (including every label on multi-label vertices).
 */
export function filterVertexTypeConfigsForCanvasVertices(
  allConfigs: DisplayVertexTypeConfig[],
  canvasVertices: DisplayVertex[],
): DisplayVertexTypeConfig[] {
  const visibleTypes = new Set<VertexType>();
  for (const vertex of canvasVertices) {
    for (const type of vertex.types) {
      visibleTypes.add(type);
    }
  }
  return allConfigs.filter(config => visibleTypes.has(config.type));
}
