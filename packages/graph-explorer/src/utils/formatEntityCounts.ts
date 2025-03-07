export function formatEntityCounts(vertexCount: number, edgeCount: number) {
  return [formatVertexCount(vertexCount), formatEdgeCount(edgeCount)]
    .filter(message => message != null)
    .join(" and ");
}

export function formatVertexCount(count: number) {
  if (count === 0) {
    return null;
  }
  return count > 1
    ? `${count.toLocaleString()} nodes`
    : `${count.toLocaleString()} node`;
}

export function formatEdgeCount(count: number) {
  if (count === 0) {
    return null;
  }
  return count > 1
    ? `${count.toLocaleString()} edges`
    : `${count.toLocaleString()} edge`;
}
