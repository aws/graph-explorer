import fs from "fs";
import path from "path";

// Construct relative paths
export const repoRoot = path.join(import.meta.dirname, "../../../");
export const configJsonPath = path.join(repoRoot, "config.json");
export const clientRoot = path.join(repoRoot, "packages", "graph-explorer");
export const proxyServerRoot = path.join(
  repoRoot,
  "packages",
  "graph-explorer-proxy-server",
);

/** Returns true if the error says the file or directory it read doesn't exist. */
export function isMissingFileError(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/** Returns true if the given path exists and is a directory, false if it does not exist, or rethrows on unexpected errors. */
export function isDirectory(path: string) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }
    throw error;
  }
}

export const certificateDir = path.join(proxyServerRoot, "cert-info");
