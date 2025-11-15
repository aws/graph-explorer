import { useActiveSchema } from "@/core";

export default function useEntitiesCounts() {
  const totalNodes = useVertexTotals();
  const totalEdges = useEdgeTotals();

  return { totalNodes, totalEdges };
}

function useVertexTotals() {
  const activeSchema = useActiveSchema();

  const hasSyncedSchema = Boolean(activeSchema.lastUpdate);
  if (!hasSyncedSchema) {
    return null;
  }

  if (activeSchema.totalVertices != null && activeSchema.totalVertices > 0) {
    return activeSchema.totalVertices;
  }

  let total = 0;
  for (const vtConfig of activeSchema.vertices) {
    const currTotal = vtConfig.total;
    if (currTotal == null) {
      return null;
    }

    total += currTotal;
  }

  return total;
}

function useEdgeTotals() {
  const activeSchema = useActiveSchema();

  const hasSyncedSchema = Boolean(activeSchema.lastUpdate);
  if (!hasSyncedSchema) {
    return null;
  }

  if (activeSchema.totalEdges != null && activeSchema.totalEdges > 0) {
    return activeSchema.totalEdges;
  }

  let total = 0;
  for (const etConfig of activeSchema.edges) {
    const currTotal = etConfig.total;
    if (currTotal == null) {
      return null;
    }
    total += currTotal;
  }
  return total;
}
