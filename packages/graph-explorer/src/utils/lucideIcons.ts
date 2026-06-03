import dynamicIconImports from "lucide-react/dynamicIconImports";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** A valid Lucide icon name (kebab-case, e.g. "user", "log-in"). */
export type IconName = keyof typeof dynamicIconImports;

/** All available Lucide icon names, sorted alphabetically. */
export const allIconNamesSorted = (
  Object.keys(dynamicIconImports) as IconName[]
).toSorted();

const allIconNamesSet = new Set<string>(allIconNamesSorted);

/**
 * Storage prefix for Lucide icon references in `iconUrl` fields.
 * A stored value like `lucide:plane` preserves the symbolic icon name so
 * the picker can highlight the current selection and config/export files
 * can carry human-readable icon references.
 */
export const LUCIDE_PREFIX = "lucide:";

/** True if `iconUrl` is a stored Lucide reference. */
export function isLucideIconRef(
  iconUrl: string | undefined,
): iconUrl is `lucide:${string}` {
  return !!iconUrl && iconUrl.startsWith(LUCIDE_PREFIX);
}

/** True if `name` matches a known Lucide icon. */
export function isValidLucideIconName(name: string): name is IconName {
  return !!name && allIconNamesSet.has(name);
}

/** Extract the icon name from a `lucide:<name>` reference, or null. */
export function getLucideName(iconUrl: string | undefined): string | null {
  if (!isLucideIconRef(iconUrl)) return null;
  return iconUrl.slice(LUCIDE_PREFIX.length);
}

/** Build a `lucide:<name>` reference for storage. */
export function toLucideIconRef(iconName: string): string {
  return `${LUCIDE_PREFIX}${iconName}`;
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
