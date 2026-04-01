import fs from "fs";
import path from "path";

// Construct relative paths
export const repoRoot = path.join(import.meta.dirname, "../../../");
export const clientRoot = path.join(repoRoot, "packages", "graph-explorer");
export const proxyServerRoot = path.join(
  repoRoot,
  "packages",
  "graph-explorer-proxy-server",
);

/** Returns true if the given path exists and is a directory, false if it does not exist, or rethrows on unexpected errors. */
export function isDirectory(path: string) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
