import dynamicIconImports from "lucide-react/dynamicIconImports";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type IconName = keyof typeof dynamicIconImports;
const allIconNames = new Set(Object.keys(dynamicIconImports));

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

export function isValidLucideIconName(name: string): name is IconName {
  return !!name && allIconNames.has(name);
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
  if (!isValidLucideIconName(iconName)) {
    return null;
  }
  try {
    const { default: Icon } = await dynamicIconImports[iconName]();
    return renderToStaticMarkup(createElement(Icon));
  } catch {
    return null;
  }
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
