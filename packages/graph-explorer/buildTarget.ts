import browserslist from "browserslist";

const targetNames = new Map([
  ["chrome", "chrome"],
  ["edge", "edge"],
  ["firefox", "firefox"],
  ["safari", "safari"],
  ["ios_saf", "ios"],
]);

/** The Vite `build.target` for the browsers in this package's `.browserslistrc`. */
export function browserslistBuildTarget(): string[] {
  const path = import.meta.dirname;
  const queries = browserslist.loadConfig({ path });
  if (!queries) {
    throw new Error(`No browserslist config found from ${path}`);
  }
  return toBuildTarget(browserslist(queries));
}

/**
 * Converts browserslist results such as `ios_saf 17.6-17.7` into Vite build
 * targets such as `ios17.6`, keeping the oldest version of each browser.
 */
export function toBuildTarget(browsers: string[]): string[] {
  const oldest = new Map<string, string>();
  for (const browser of browsers) {
    const [name, versionRange] = browser.split(" ");
    const target = targetNames.get(name);
    if (!target) {
      throw new Error(`No Vite build target for browser "${name}"`);
    }
    const version = versionRange.split("-")[0];
    const current = oldest.get(target);
    if (!current || compareVersions(version, current) < 0) {
      oldest.set(target, version);
    }
  }
  return Array.from(oldest, ([target, version]) => `${target}${version}`);
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor = 0] = a.split(".").map(Number);
  const [bMajor, bMinor = 0] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}
