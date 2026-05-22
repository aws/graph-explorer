import dynamicIconImports from "lucide-react/dynamicIconImports";

type IconNodeChild = [string, Record<string, string>];

interface LucideIconModule {
  __iconNode?: IconNodeChild[];
  default?: unknown;
}

/**
 * Storage prefix for Lucide icon references in `iconUrl` fields.
 * A stored value like `lucide:plane` preserves the symbolic icon name so
 * the picker can highlight the current selection and config/export files
 * can carry human-readable icon references.
 */
export const LUCIDE_PREFIX = "lucide:";

/** True if `iconUrl` is a stored Lucide reference. */
export function isLucideIconRef(iconUrl: string | undefined): boolean {
  return !!iconUrl && iconUrl.startsWith(LUCIDE_PREFIX);
}

/** Extract the icon name from a `lucide:<name>` reference, or null. */
export function getLucideName(iconUrl: string | undefined): string | null {
  if (!isLucideIconRef(iconUrl)) return null;
  return iconUrl!.slice(LUCIDE_PREFIX.length);
}

/** Build a `lucide:<name>` reference for storage. */
export function toLucideIconRef(iconName: string): string {
  return `${LUCIDE_PREFIX}${iconName}`;
}

/**
 * Resolves a stored `iconUrl` to a value suitable for `<img>` / `<SVG>` src.
 * - `lucide:<name>` → base64 SVG data URI (resolved + cached)
 * - `data:...` → passthrough
 * - any other string → passthrough (treated as URL)
 * - `undefined` / `null` → null
 */
export async function resolveIconUrl(
  iconUrl: string | undefined,
): Promise<string | null> {
  if (!iconUrl) return null;
  const name = getLucideName(iconUrl);
  if (name) return await lucideIconToDataUri(name);
  return iconUrl;
}

/**
 * Returns the raw SVG markup for a Lucide icon by name, or null if unknown.
 * Used by render pipelines (e.g., Cytoscape) that need the SVG text rather
 * than a data URI.
 */
export async function getLucideSvgString(
  iconName: string,
): Promise<string | null> {
  const iconNode = await getLucideIconNode(iconName);
  if (!iconNode) return null;
  return buildSvgString(iconNode);
}

/**
 * Converts a Lucide icon name to a base64-encoded SVG data URI.
 *
 * Icon names use kebab-case (e.g., "user", "log-in", "landmark").
 * See https://lucide.dev/icons for available icon names.
 *
 * @param iconName The kebab-case icon name from lucide.
 * @returns A data URI string for the SVG icon, or null if the icon name is not found.
 */
export async function lucideIconToDataUri(
  iconName: string,
): Promise<string | null> {
  const svgString = await getLucideSvgString(iconName);
  if (!svgString) return null;
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

const iconCache = new Map<string, IconNodeChild[] | null>();

async function getLucideIconNode(
  iconName: string,
): Promise<IconNodeChild[] | null> {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName) ?? null;
  }

  try {
    // Use lucide-react's dynamicIconImports which provides Vite-compatible
    // lazy loaders for each icon. Each module exports __iconNode as a named
    // export containing SVG element data as [elementTag, attributes][] tuples.
    const importFn =
      dynamicIconImports[iconName as keyof typeof dynamicIconImports];
    if (!importFn) {
      iconCache.set(iconName, null);
      return null;
    }

    const mod = (await importFn()) as LucideIconModule;

    if (!mod.__iconNode) {
      iconCache.set(iconName, null);
      return null;
    }

    iconCache.set(iconName, mod.__iconNode);
    return mod.__iconNode;
  } catch {
    iconCache.set(iconName, null);
    return null;
  }
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSvgString(nodes: IconNodeChild[]): string {
  const children = nodes
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${escapeXmlAttr(value)}"`)
        .join(" ");
      return `<${tag} ${attrStr} />`;
    })
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="1em" height="1em" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">` +
    `${children}</svg>`
  );
}
