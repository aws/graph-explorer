import dynamicIconImports from "lucide-react/dynamicIconImports";

type IconNodeChild = [string, Record<string, string>];

interface LucideIconModule {
  __iconNode?: IconNodeChild[];
  default?: unknown;
}

/**
 * Converts a lucide icon name to a base64-encoded SVG data URI.
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
  const iconNode = await getLucideIconNode(iconName);
  if (!iconNode) {
    return null;
  }
  const svgString = buildSvgString(iconNode);
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
