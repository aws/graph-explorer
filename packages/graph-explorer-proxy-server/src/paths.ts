import path from "path";

// Construct relative paths
export const repoRoot = path.join(import.meta.dirname, "../../../");
export const clientRoot = path.join(repoRoot, "packages", "graph-explorer");
export const proxyServerRoot = path.join(
  repoRoot,
  "packages",
  "graph-explorer-proxy-server",
);
